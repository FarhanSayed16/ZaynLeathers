/**
 * Backend mode for the storefront.
 *
 * - "woocommerce" → Hostinger WordPress / WooCommerce (client backend)
 * - "node"        → legacy Express API (local / other clients)
 *
 * Set via: VITE_BACKEND_MODE=woocommerce
 */

const raw = String(import.meta.env.VITE_BACKEND_MODE || "node")
  .trim()
  .toLowerCase();

export const BACKEND_MODE =
  raw === "woocommerce" || raw === "woo" || raw === "wc" ? "woocommerce" : "node";

export const isWooMode = BACKEND_MODE === "woocommerce";
export const isNodeMode = BACKEND_MODE === "node";

/** Base URL for Node API, or Woo site URL when in Woo mode (for legacy callers). */
export function getApiBase() {
  if (isWooMode) {
    return String(import.meta.env.VITE_WC_URL || "").replace(/\/$/, "");
  }
  return String(import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
}
