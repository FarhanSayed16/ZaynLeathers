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

function getCartToken() {
  return localStorage.getItem(CART_TOKEN_KEY) || "";
}

function setCartToken(token) {
  if (token) localStorage.setItem(CART_TOKEN_KEY, token);
}

function clearCartToken() {
  localStorage.removeItem(CART_TOKEN_KEY);
}

/* ────────────────────────────────────────────────
 * URL builders
 * ──────────────────────────────────────────────── */

/**
 * WooCommerce REST API v3 — admin-level CRUD.
 * @param {string} path – e.g. "products", "orders/123"
 * @param {Record<string, string>} params – extra query params
 */
function wcUrl(path, params = {}) {
  const url = new URL(`/wp-json/wc/v3/${path}`, WC_BASE);
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
  const url = new URL(`/wp-json/wc/store/v1/${path}`, WC_BASE);
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
  const url = new URL(`/wp-json/${path}`, WC_BASE);
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
  const defaults = {
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
  };

  const merged = {
    ...defaults,
    ...options,
    headers: { ...defaults.headers, ...options.headers },
  };

  const res = await fetch(url, merged);

  // Capture Cart-Token from Store API responses for session persistence
  const cartToken = res.headers.get("Cart-Token") || res.headers.get("X-WC-Store-API-Nonce");
  if (cartToken) setCartToken(cartToken);

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
  const headers = { ...options.headers };
  if (cartToken) headers["Cart-Token"] = cartToken;
  return request(url, { ...options, headers });
}

/**
 * Store API request with JWT auth (for logged-in customers).
 * Sends both the Cart-Token and Authorization headers.
 */
function storeAuthRequest(url, token, options = {}) {
  const cartToken = getCartToken();
  const headers = { ...options.headers };
  if (cartToken) headers["Cart-Token"] = cartToken;
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
