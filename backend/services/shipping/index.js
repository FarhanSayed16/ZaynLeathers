import manualProvider from "./manual.js";
import shiprocketProvider from "./shiprocket.js";
import brand from "../../../shared/brand.config.js";

export const isShippingEnabled = () =>
  String(process.env.SHIPPING_ENABLED || "").toLowerCase() === "true";

export const isDynamicRatesEnabled = () =>
  isShippingEnabled() &&
  String(process.env.SHIPPING_DYNAMIC_RATES || "").toLowerCase() === "true";

export const getShippingPartnerName = () => {
  if (!isShippingEnabled()) return null;
  return (process.env.SHIPPING_PARTNER || "shiprocket").toLowerCase();
};

export function getShippingProvider() {
  if (!isShippingEnabled()) return manualProvider;

  switch (getShippingPartnerName()) {
    case "shiprocket":
      return shiprocketProvider;
    default:
      return manualProvider;
  }
}

export function getShippingConfig() {
  return {
    enabled: isShippingEnabled(),
    partner: getShippingPartnerName(),
    dynamicRates: isDynamicRatesEnabled(),
    pickupPincode: process.env.SHIPROCKET_PICKUP_PINCODE || null,
    flatDeliveryFee: brand.commerce?.deliveryFee ?? 41,
  };
}

/**
 * Map courier / Shiprocket status strings → Afiya Leathers item statuses.
 * Pass { isReturn: true } when the event is for a reverse shipment.
 */
export function mapPartnerStatusToBrand(partnerStatus = "", { isReturn = false } = {}) {
  const s = String(partnerStatus).toLowerCase().trim();

  if (!s) return null;

  if (isReturn) {
    if (s.includes("delivered") || s.includes("return delivered") || s.includes("rto delivered")) {
      return "Returned";
    }
    if (
      s.includes("picked") ||
      s.includes("in transit") ||
      s.includes("out for delivery") ||
      s.includes("dispatched")
    ) {
      return "ReturnInTransit";
    }
    if (s.includes("cancel")) return "Delivered"; // return cancelled → back to delivered
    return "ReturnInTransit";
  }

  if (s.includes("return") && (s.includes("delivered") || s.includes("complete"))) {
    return "Returned";
  }
  if (s.includes("return") && (s.includes("transit") || s.includes("pickup") || s.includes("picked"))) {
    return "ReturnInTransit";
  }

  if (s.includes("delivered") || s === "delivered") {
    if (s.includes("rto")) return "RTO";
    return "Delivered";
  }

  if (
    s.includes("out for delivery") ||
    s.includes("out_for_delivery") ||
    s === "ofd"
  ) {
    return "OutForDelivery";
  }

  if (
    s.includes("picked up") ||
    s.includes("picked_up") ||
    s.includes("in transit") ||
    s.includes("in_transit") ||
    s.includes("shipped") ||
    s.includes("dispatched") ||
    s.includes("manifested")
  ) {
    return "Shipped";
  }

  if (
    s.includes("rto") ||
    s.includes("return to origin") ||
    s.includes("undelivered")
  ) {
    return "RTO";
  }

  if (s.includes("cancel")) {
    return "Cancelled";
  }

  if (
    s.includes("pickup") ||
    s.includes("new") ||
    s.includes("processing") ||
    s.includes("ready to ship")
  ) {
    return "Packing";
  }

  return null;
}
