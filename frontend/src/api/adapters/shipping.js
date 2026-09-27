/**
 * ============================================================
 * Shipping Adapter — WooCommerce / Custom ↔ Frontend
 * ============================================================
 * Handles shipping serviceability checks and rate calculation.
 * Can integrate with Shiprocket, Delhivery, or any provider
 * via a custom WordPress endpoint.
 * ============================================================
 */

import { wpUrl, request } from "../wooClient.js";

/**
 * Check if a pincode is serviceable and get estimated delivery.
 * This calls a custom WP endpoint that internally checks with
 * the shipping provider (Shiprocket, Delhivery, etc.)
 *
 * @param {string} pincode - 6-digit Indian pincode
 * @param {string} [cod] - "1" for COD, "0" for prepaid
 * @returns {Promise<Object>}
 */
export async function checkServiceability(pincode, cod = "0") {
  try {
    const url = wpUrl("zayn/v1/shipping/serviceability");
    const data = await request(url + `?pincode=${pincode}&cod=${cod}`);

    return {
      success: true,
      serviceable: data.serviceable !== false,
      estimatedDays: data.estimatedDays || null,
      estimatedRate: data.estimatedRate || null,
      deliveryFee: data.deliveryFee || null,
      dynamicRates: Boolean(data.dynamicRates),
      warning: data.warning || null,
    };
  } catch (err) {
    return {
      success: false,
      serviceable: true, // Don't block orders on API failure
      estimatedDays: null,
      estimatedRate: null,
      deliveryFee: null,
      dynamicRates: false,
      warning: "Could not verify pincode — you can still place the order",
    };
  }
}

/**
 * Get shipping tracking details for an order.
 * @param {string} orderId
 * @returns {Promise<Object|null>}
 */
export async function getTrackingDetails(orderId) {
  try {
    const url = wpUrl(`zayn/v1/shipping/tracking/${orderId}`);
    const data = await request(url);
    return {
      trackingNumber: data.trackingNumber || "",
      courier: data.courier || "",
      trackingUrl: data.trackingUrl || "",
      status: data.status || "",
      events: data.events || [],
    };
  } catch {
    return null;
  }
}
