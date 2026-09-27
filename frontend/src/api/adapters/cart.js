/**
 * ============================================================
 * Cart Adapter — WooCommerce Store API v1 ↔ Frontend
 * ============================================================
 * Uses the native WooCommerce Store API (built into WC core,
 * no plugin needed) for headless cart management.
 *
 * Store API endpoints:
 *   GET    /wc/store/v1/cart               — view cart
 *   POST   /wc/store/v1/cart/add-item      — add item
 *   POST   /wc/store/v1/cart/remove-item   — remove item
 *   POST   /wc/store/v1/cart/update-item   — update quantity
 *   POST   /wc/store/v1/cart/apply-coupon  — apply coupon
 *   POST   /wc/store/v1/cart/remove-coupon — remove coupon
 *   DELETE /wc/store/v1/cart/items         — clear cart (extension)
 *
 * Session persistence: Uses Cart-Token header (handled
 * automatically by wooClient.js storeRequest helpers).
 *
 * Your frontend stores cart as: { [productId]: { [size]: qty } }
 * Store API stores cart as line items with `key` identifiers.
 * ============================================================
 */

import { storeUrl, storeRequest, storeAuthRequest, clearCartToken } from "../wooClient.js";

/**
 * Get the current cart contents.
 * @param {string} [token] - JWT token for authenticated customers
 * @returns {Promise<{ cartData: Object, raw: Object }>}
 *   cartData = frontend format { [productId]: { [size]: qty } }
 *   raw = full Store API response (for item keys, totals, etc.)
 */
export async function getCart(token) {
  const url = storeUrl("cart");
  const cart = token
    ? await storeAuthRequest(url, token)
    : await storeRequest(url);

  return {
    cartData: mapStoreCartToFrontend(cart),
    raw: cart,
  };
}

/**
 * Add an item to the cart.
 * @param {string} productId - WooCommerce product ID
 * @param {string} size - Size value (sent as item extension data)
 * @param {number} [quantity=1]
 * @param {string} [token]
 */
export async function addToCart(productId, size, quantity = 1, token) {
  const url = storeUrl("cart/add-item");
  const body = JSON.stringify({
    id: Number(productId),
    quantity,
    // Store API supports extensions for custom item data
    extensions: {
      "zayn-leathers": { size },
    },
  });

  const cart = token
    ? await storeAuthRequest(url, token, { method: "POST", body })
    : await storeRequest(url, { method: "POST", body });

  return {
    cartData: mapStoreCartToFrontend(cart),
    raw: cart,
  };
}

/**
 * Update item quantity in the cart.
 * @param {string} itemKey - Store API item key
 * @param {number} quantity - New quantity (0 = remove)
 * @param {string} [token]
 */
export async function updateCartItem(itemKey, quantity, token) {
  // If quantity is 0, remove the item instead
  if (quantity <= 0) {
    return removeCartItem(itemKey, token);
  }

  const url = storeUrl("cart/update-item");
  const body = JSON.stringify({
    key: itemKey,
    quantity,
  });

  const cart = token
    ? await storeAuthRequest(url, token, { method: "POST", body })
    : await storeRequest(url, { method: "POST", body });

  return {
    cartData: mapStoreCartToFrontend(cart),
    raw: cart,
  };
}

/**
 * Remove an item from the cart.
 * @param {string} itemKey - Store API item key
 * @param {string} [token]
 */
export async function removeCartItem(itemKey, token) {
  const url = storeUrl("cart/remove-item");
  const body = JSON.stringify({ key: itemKey });

  const cart = token
    ? await storeAuthRequest(url, token, { method: "POST", body })
    : await storeRequest(url, { method: "POST", body });

  return {
    cartData: mapStoreCartToFrontend(cart),
    raw: cart,
  };
}

/**
 * Apply a coupon to the cart.
 * @param {string} code - Coupon code
 * @param {string} [token]
 */
export async function applyCoupon(code, token) {
  const url = storeUrl("cart/apply-coupon");
  const body = JSON.stringify({ code });

  const cart = token
    ? await storeAuthRequest(url, token, { method: "POST", body })
    : await storeRequest(url, { method: "POST", body });

  return {
    cartData: mapStoreCartToFrontend(cart),
    raw: cart,
  };
}

/**
 * Remove a coupon from the cart.
 * @param {string} code
 * @param {string} [token]
 */
export async function removeCoupon(code, token) {
  const url = storeUrl("cart/remove-coupon");
  const body = JSON.stringify({ code });

  const cart = token
    ? await storeAuthRequest(url, token, { method: "POST", body })
    : await storeRequest(url, { method: "POST", body });

  return {
    cartData: mapStoreCartToFrontend(cart),
    raw: cart,
  };
}

/**
 * Clear the entire cart.
 * Note: Store API doesn't have a direct "clear" endpoint.
 * We remove each item individually.
 * @param {string} [token]
 */
export async function clearCart(token) {
  const { raw } = await getCart(token);
  const items = raw?.items || [];

  for (const item of items) {
    await removeCartItem(item.key, token);
  }

  clearCartToken();
  return { cartData: {}, raw: null };
}

/**
 * Merge guest cart into authenticated cart after login.
 * Adds each guest cart item to the server cart via Store API.
 *
 * @param {Object} guestCart - Frontend format { [productId]: { [size]: qty } }
 * @param {string} token - JWT token
 */
export async function mergeGuestCart(guestCart, token) {
  for (const productId of Object.keys(guestCart)) {
    for (const size of Object.keys(guestCart[productId])) {
      const qty = guestCart[productId][size];
      if (qty > 0) {
        await addToCart(productId, size, qty, token);
      }
    }
  }

  // Return the final merged cart
  return getCart(token);
}

// ────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────

/**
 * Map Store API cart response → frontend format { [productId]: { [size]: qty } }.
 *
 * Store API cart items have:
 *   item.id         – product ID
 *   item.quantity    – quantity
 *   item.key         – unique key for update/remove
 *   item.extensions  – custom data (where we store "size")
 *   item.variation   – variation attributes (alternative size source)
 */
function mapStoreCartToFrontend(storeCart) {
  const cartData = {};
  const items = storeCart?.items || [];

  for (const item of items) {
    const productId = String(item.id);
    const size = extractSize(item);
    const qty = item.quantity || 0;

    if (!cartData[productId]) {
      cartData[productId] = {};
    }
    cartData[productId][size] = (cartData[productId][size] || 0) + qty;
  }

  return cartData;
}

/**
 * Extract the size from a Store API cart item.
 * Checks extensions first, then variation attributes, then meta.
 */
function extractSize(item) {
  // 1. Check our custom extension data
  const ext = item.extensions?.["zayn-leathers"];
  if (ext?.size) return ext.size;

  // 2. Check variation attributes (for variable products)
  const variation = item.variation || [];
  const sizeVar = variation.find(
    (v) => v.attribute?.toLowerCase() === "size" || v.attribute === "pa_size"
  );
  if (sizeVar?.value) return sizeVar.value;

  // 3. Check item_data / meta (legacy)
  const meta = item.meta || item.item_data || {};
  if (meta.size) return meta.size;

  return "Free Size";
}

/**
 * Build a lookup map: composite key "productId:size" → Store API item key.
 * Useful for finding the right item_key when updating/removing from
 * the frontend's { [productId]: { [size]: qty } } format.
 *
 * @param {Object} storeCart - Raw Store API cart response
 * @returns {Record<string, string>} - { "123:M": "abc123def456", ... }
 */
export function buildItemKeyMap(storeCart) {
  const map = {};
  const items = storeCart?.items || [];

  for (const item of items) {
    const key = `${item.id}:${extractSize(item)}`;
    map[key] = item.key;
  }

  return map;
}

/**
 * Get Store API cart totals in a clean format.
 * @param {Object} storeCart - Raw Store API cart response
 */
export function getCartTotals(storeCart) {
  if (!storeCart?.totals) return null;

  const t = storeCart.totals;
  // Store API returns amounts in minor units (paise for INR)
  const divisor = Math.pow(10, t.currency_minor_unit || 2);

  return {
    subtotal: Number(t.total_items || 0) / divisor,
    shipping: Number(t.total_shipping || 0) / divisor,
    discount: Number(t.total_discount || 0) / divisor,
    tax: Number(t.total_tax || 0) / divisor,
    total: Number(t.total_price || 0) / divisor,
    currency: t.currency_code || "INR",
    itemCount: storeCart.items_count || 0,
  };
}
