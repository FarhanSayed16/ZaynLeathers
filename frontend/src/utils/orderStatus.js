/** Canonical fulfillment keys used by the customer tracker UI. */
export const STATUS_LABELS = {
  OrderPlaced: "Placed",
  Packing: "Packing",
  Shipped: "Shipped",
  OutForDelivery: "Out for delivery",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
  RTO: "Returned to origin",
  ReturnRequested: "Return requested",
  ReturnInTransit: "Return in transit",
  Returned: "Returned",
};

export const TRACKING_STAGES = [
  "OrderPlaced",
  "Packing",
  "Shipped",
  "OutForDelivery",
  "Delivered",
];

/** Woo / legacy aliases → tracker keys */
const STATUS_ALIASES = {
  orderplaced: "OrderPlaced",
  "order placed": "OrderPlaced",
  placed: "OrderPlaced",
  pending: "OrderPlaced",
  "on-hold": "OrderPlaced",
  onhold: "OrderPlaced",
  packing: "Packing",
  processing: "Packing",
  shipped: "Shipped",
  outfordelivery: "OutForDelivery",
  "out-for-delivery": "OutForDelivery",
  "out for delivery": "OutForDelivery",
  delivered: "Delivered",
  completed: "Delivered",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  refunded: "Cancelled",
  failed: "Cancelled",
  rto: "RTO",
  returnrequested: "ReturnRequested",
  returnintransit: "ReturnInTransit",
  returned: "Returned",
};

/**
 * Normalize any Woo / Nest / free-text status into a tracker key.
 */
export function normalizeOrderStatus(status) {
  if (status == null || status === "") return "OrderPlaced";
  const raw = String(status).trim();
  if (STATUS_LABELS[raw]) return raw;
  const key = raw.toLowerCase().replace(/^wc-/, "").replace(/_/g, " ").replace(/\s+/g, " ");
  const compact = key.replace(/\s+/g, "");
  return (
    STATUS_ALIASES[key] ||
    STATUS_ALIASES[compact] ||
    STATUS_ALIASES[raw.toLowerCase()] ||
    "OrderPlaced"
  );
}

export function statusLabel(status) {
  const key = normalizeOrderStatus(status);
  return STATUS_LABELS[key] || key || "Update";
}

export function trackingStageIndex(status) {
  const key = normalizeOrderStatus(status);
  return TRACKING_STAGES.indexOf(key);
}

export function resolveItemStatus(order, item) {
  return normalizeOrderStatus(item?.status || order?.status || "OrderPlaced");
}

export function canCustomerCancel(status) {
  const key = normalizeOrderStatus(status);
  return key === "OrderPlaced" || key === "Packing";
}

export function isTerminalStatus(status) {
  const key = normalizeOrderStatus(status);
  return key === "Delivered" || key === "Cancelled" || key === "Returned";
}

/**
 * Customer-facing paid flag.
 * COD stays “pay on delivery” until the order is Completed in Woo.
 */
export function isOrderPaidForDisplay(order) {
  const method = String(order?.paymentMethod || "").toLowerCase();
  if (method === "cod") {
    return normalizeOrderStatus(order?.status) === "Delivered";
  }
  if (order?.payment?.paid === true) return true;
  if (order?.payment?.datePaid) return true;
  return false;
}

export function paymentStatusLabel(order) {
  if (isOrderPaidForDisplay(order)) return "Paid in full";
  const method = String(order?.paymentMethod || "").toLowerCase();
  if (method === "cod") return "Pay on delivery";
  if (method === "partial") return "Partial payment";
  return "Payment pending";
}

export function shortOrderId(id) {
  return String(id || "").slice(-8).toUpperCase();
}
