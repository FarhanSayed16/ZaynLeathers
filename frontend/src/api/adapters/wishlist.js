/**
 * ============================================================
 * Wishlist Adapter — YITH WooCommerce Wishlist ↔ Frontend
 * ============================================================
 * Uses the YITH WooCommerce Wishlist plugin REST API
 * or falls back to WordPress user meta storage.
 *
 * Plugin: YITH WooCommerce Wishlist (free version available)
 * ============================================================
 */

import { wpUrl, request, authRequest } from "../wooClient.js";

/**
 * Get the user's wishlist.
 * @param {string} token - JWT token
 * @returns {Promise<string[]>} - Array of product IDs
 */
export async function getWishlist(token) {
  try {
    // Try YITH Wishlist API first
    const url = wpUrl("yith/wishlist/v1/wishlists");
    const wishlists = await authRequest(url, token);

    if (wishlists && wishlists.length > 0) {
      // Get items from the default wishlist
      const defaultList = wishlists[0];
      const itemsUrl = wpUrl(`yith/wishlist/v1/wishlists/${defaultList.id}/products`);
      const items = await authRequest(itemsUrl, token);
      return (items || []).map((item) => String(item.product_id));
    }

    return [];
  } catch {
    // Fallback: use custom WP user meta endpoint
    try {
      const url = wpUrl("zayn/v1/wishlist");
      const data = await authRequest(url, token);
      return (data.wishlist || []).map(String);
    } catch {
      return [];
    }
  }
}

/**
 * Add a product to the wishlist.
 * @param {string} productId
 * @param {string} token
 */
export async function addToWishlist(productId, token) {
  try {
    // Try YITH first
    const listUrl = wpUrl("yith/wishlist/v1/wishlists");
    const wishlists = await authRequest(listUrl, token);
    const defaultList = wishlists?.[0];

    if (defaultList) {
      const url = wpUrl(`yith/wishlist/v1/wishlists/${defaultList.id}/products`);
      await authRequest(url, token, {
        method: "POST",
        body: JSON.stringify({ product_id: Number(productId) }),
      });
      return true;
    }
  } catch {
    // Fallback: custom endpoint
  }

  // Fallback: custom WP REST endpoint
  const url = wpUrl("zayn/v1/wishlist/add");
  await authRequest(url, token, {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
  return true;
}

/**
 * Remove a product from the wishlist.
 * @param {string} productId
 * @param {string} token
 */
export async function removeFromWishlist(productId, token) {
  try {
    // Try YITH first
    const listUrl = wpUrl("yith/wishlist/v1/wishlists");
    const wishlists = await authRequest(listUrl, token);
    const defaultList = wishlists?.[0];

    if (defaultList) {
      const url = wpUrl(
        `yith/wishlist/v1/wishlists/${defaultList.id}/products/${productId}`
      );
      await authRequest(url, token, { method: "DELETE" });
      return true;
    }
  } catch {
    // Fallback: custom endpoint
  }

  // Fallback
  const url = wpUrl("zayn/v1/wishlist/remove");
  await authRequest(url, token, {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
  return true;
}
