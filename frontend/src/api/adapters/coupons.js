/**
 * ============================================================
 * Coupons Adapter — WooCommerce ↔ Frontend
 * ============================================================
 * Validates and applies coupons via WooCommerce REST API.
 * ============================================================
 */

import { wcUrl, request } from "../wooClient.js";

/**
 * Validate a coupon code and return its details.
 * @param {string} code - Coupon code entered by the user
 * @returns {Promise<Object|null>} - Coupon details or null if invalid
 */
export async function validateCoupon(code) {
  try {
    const url = wcUrl("coupons", { code: code.trim() });
    const coupons = await request(url);

    if (!coupons.length) {
      return { valid: false, message: "Invalid coupon code" };
    }

    const coupon = coupons[0];

    // Check expiry
    if (coupon.date_expires) {
      const expiry = new Date(coupon.date_expires);
      if (expiry < new Date()) {
        return { valid: false, message: "This coupon has expired" };
      }
    }

    // Check usage limit
    if (
      coupon.usage_limit &&
      coupon.usage_count >= coupon.usage_limit
    ) {
      return { valid: false, message: "This coupon has reached its usage limit" };
    }

    return {
      valid: true,
      code: coupon.code,
      discount: Number(coupon.amount || 0),
      discountType: coupon.discount_type, // "percent" or "fixed_cart" or "fixed_product"
      description: coupon.description || "",
      minimumAmount: Number(coupon.minimum_amount || 0),
      maximumAmount: Number(coupon.maximum_amount || 0),
      freeShipping: coupon.free_shipping || false,
      // Map to your frontend's expected shape
      _mapped: {
        code: coupon.code,
        discount:
          coupon.discount_type === "percent"
            ? Number(coupon.amount)
            : null,
        fixedDiscount:
          coupon.discount_type !== "percent"
            ? Number(coupon.amount)
            : null,
        type: coupon.discount_type,
      },
    };
  } catch (err) {
    return { valid: false, message: err.message || "Failed to validate coupon" };
  }
}

/**
 * List active (non-expired) coupons for hint chips.
 */
export async function fetchActiveCoupons() {
  try {
    const url = wcUrl("coupons", {
      per_page: 20,
      orderby: "date",
      order: "desc",
    });
    const coupons = await request(url);
    const now = new Date();
    return (coupons || [])
      .filter((c) => {
        if (c.date_expires && new Date(c.date_expires) < now) return false;
        if (c.usage_limit && c.usage_count >= c.usage_limit) return false;
        return true;
      })
      .map((c) => ({
        code: c.code,
        discount: c.discount_type === "percent" ? Number(c.amount) : null,
        description: c.description || "",
      }));
  } catch {
    return [];
  }
}
