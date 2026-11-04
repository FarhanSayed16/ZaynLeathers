/**
 * Wishlist Adapter — Zayn custom WP user-meta API
 * (YITH is not installed on Hostinger; do not call its routes.)
 */

import { wpUrl, authRequest } from "../wooClient.js";

/**
 * Get the user's wishlist.
 * @param {string} token - JWT token
 * @returns {Promise<string[]>} - Array of product IDs
 */
export async function getWishlist(token) {
  try {
    const url = wpUrl("zayn/v1/wishlist");
    const data = await authRequest(url, token);
    return (data.wishlist || []).map(String);
  } catch {
    return [];
  }
}

/**
 * Add a product to the wishlist.
 * @param {string} productId
 * @param {string} token
 */
export async function addToWishlist(productId, token) {
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
  const url = wpUrl("zayn/v1/wishlist/remove");
  await authRequest(url, token, {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
  return true;
}
