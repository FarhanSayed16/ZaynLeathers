/**
 * ============================================================
 * Unified WooCommerce API — Single Entry Point
 * ============================================================
 * Re-exports every adapter so the rest of the frontend can
 * import from a single location:
 *
 *   import { wooApi } from '../api';
 *   const products = await wooApi.products.fetchAllProducts();
 *
 * ============================================================
 */

import * as products from "./adapters/products.js";
import * as cart from "./adapters/cart.js";
import * as auth from "./adapters/auth.js";
import * as orders from "./adapters/orders.js";
import * as categories from "./adapters/categories.js";
import * as reviews from "./adapters/reviews.js";
import * as coupons from "./adapters/coupons.js";
import * as wishlist from "./adapters/wishlist.js";
import * as settings from "./adapters/settings.js";
import * as shipping from "./adapters/shipping.js";

export const wooApi = {
  products,
  cart,
  auth,
  orders,
  categories,
  reviews,
  coupons,
  wishlist,
  settings,
  shipping,
};

// Also export each adapter individually for tree-shaking
export { products, cart, auth, orders, categories, reviews, coupons, wishlist, settings, shipping };

// Preferred entry for the storefront (mode-aware: Node or Woo)
export * as shopApi from "./shopApi.js";
export { isWooMode, BACKEND_MODE, getApiBase } from "./mode.js";

