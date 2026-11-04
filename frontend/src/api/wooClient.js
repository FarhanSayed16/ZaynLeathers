/**
 * ============================================================
 * WooCommerce REST API Client
 * ============================================================
 * Low-level HTTP client that handles authentication and request
 * formatting for:
 *   - WooCommerce REST API v3 (products, orders, customers, etc.)
 *   - WooCommerce Store API v1 (cart, checkout — built into WC core)
 *   - WordPress REST API (JWT auth, custom endpoints)
 *
 * Auth methods:
 *   - Consumer Key/Secret (query-string) for WC REST API v3
 *   - Cart-Token header for Store API (stateless cart sessions)
 *   - JWT Bearer token for customer-facing endpoints
 * ============================================================
 */

const WC_BASE = import.meta.env.VITE_WC_URL;           // e.g. https://zaynleather.com
const WC_CK   = import.meta.env.VITE_WC_CONSUMER_KEY;  // ck_xxxxx
const WC_CS   = import.meta.env.VITE_WC_CONSUMER_SECRET; // cs_xxxxx

/* ────────────────────────────────────────────────
 * Cart-Token persistence (Store API uses this
 * instead of cookies for headless frontends)
 * ──────────────────────────────────────────────── */
const CART_TOKEN_KEY = "zayn_cart_token";
const STORE_NONCE_KEY = "zayn_store_nonce";

function getCartToken() {
  return localStorage.getItem(CART_TOKEN_KEY) || "";
}

function setCartToken(token) {
  if (token) localStorage.setItem(CART_TOKEN_KEY, token);
}

function clearCartToken() {
  localStorage.removeItem(CART_TOKEN_KEY);
  clearStoreNonce();
}

function getStoreNonce() {
  return localStorage.getItem(STORE_NONCE_KEY) || "";
}

function setStoreNonce(nonce) {
  if (nonce) localStorage.setItem(STORE_NONCE_KEY, nonce);
}

function clearStoreNonce() {
  localStorage.removeItem(STORE_NONCE_KEY);
}

/* ────────────────────────────────────────────────
 * URL builders
 * ──────────────────────────────────────────────── */

/**
 * WooCommerce REST API v3 — admin-level CRUD.
 * @param {string} path – e.g. "products", "orders/123"
 * @param {Record<string, string>} params – extra query params
 */
function apiBase() {
  // Dev requests stay on localhost and Vite proxies them, so the browser
  // never makes a cross-origin call to Hostinger.
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return window.location.origin;
  }
  return WC_BASE;
}

function wcUrl(path, params = {}) {
  const url = new URL(`/wp-json/wc/v3/${path}`, apiBase());
  if (WC_CK) url.searchParams.set("consumer_key", WC_CK);
  if (WC_CS) url.searchParams.set("consumer_secret", WC_CS);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  });
  return url.toString();
}

/**
 * WooCommerce Store API v1 — built into WC core (no plugin needed).
 * Handles cart, checkout, and coupon operations for headless frontends.
 * @param {string} path – e.g. "cart", "cart/items", "checkout"
 * @param {Record<string, string>} params
 */
function storeUrl(path, params = {}) {
  const url = new URL(`/wp-json/wc/store/v1/${path}`, apiBase());
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  });
  return url.toString();
}

/**
 * WordPress REST API — custom endpoints, JWT auth, users.
 * @param {string} path – e.g. "jwt-auth/v1/token"
 * @param {Record<string, string>} params
 */
function wpUrl(path, params = {}) {
  const url = new URL(`/wp-json/${path}`, apiBase());
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  });
  return url.toString();
}

/* ────────────────────────────────────────────────
 * Fetch wrappers
 * ──────────────────────────────────────────────── */

/**
 * Generic fetch wrapper with JSON parsing and error handling.
 */
async function request(url, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const headers = { ...(options.headers || {}) };
  if (options.body != null && !headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }
  // A JSON content type on GET forces a CORS preflight. GET has no body.
  if ((method === "GET" || method === "HEAD") && options.body == null) {
    delete headers["Content-Type"];
    delete headers["content-type"];
  }

  const merged = {
    credentials: "omit",
    ...options,
    method,
    headers,
  };

  const res = await fetch(url, {
    ...merged,
    signal: merged.signal || AbortSignal.timeout(45000),
  });

  // Capture Store API session headers (readable only when CORS exposes them)
  const cartToken = res.headers.get("Cart-Token");
  if (cartToken) setCartToken(cartToken);
  const storeNonce =
    res.headers.get("Nonce") || res.headers.get("X-WC-Store-API-Nonce");
  if (storeNonce) setStoreNonce(storeNonce);

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      errorMsg = body.message || body.error || errorMsg;
    } catch { /* no JSON body */ }
    throw new Error(errorMsg);
  }

  if (res.status === 204) return null;
  return res.json();
}

/**
 * JWT-authenticated request (for customer endpoints).
 */
function authRequest(url, token, options = {}) {
  return request(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Store API request — includes Cart-Token header for session persistence.
 * This is how the Store API identifies the cart in a headless (no-cookie) setup.
 */
function storeRequest(url, options = {}) {
  const cartToken = getCartToken();
  const storeNonce = getStoreNonce();
  const headers = { ...options.headers };
  if (cartToken) headers["Cart-Token"] = cartToken;
  if (storeNonce) {
    headers.Nonce = storeNonce;
    headers["X-WC-Store-API-Nonce"] = storeNonce;
  }
  return request(url, { ...options, headers });
}

/**
 * Store API request with JWT auth (for logged-in customers).
 * Sends both the Cart-Token and Authorization headers.
 */
function storeAuthRequest(url, token, options = {}) {
  const cartToken = getCartToken();
  const storeNonce = getStoreNonce();
  const headers = { ...options.headers };
  if (cartToken) headers["Cart-Token"] = cartToken;
  if (storeNonce) {
    headers.Nonce = storeNonce;
    headers["X-WC-Store-API-Nonce"] = storeNonce;
  }
  headers.Authorization = `Bearer ${token}`;
  return request(url, { ...options, headers });
}

export {
  wcUrl,
  storeUrl,
  wpUrl,
  request,
  authRequest,
  storeRequest,
  storeAuthRequest,
  getCartToken,
  setCartToken,
  clearCartToken,
  WC_BASE,
};
