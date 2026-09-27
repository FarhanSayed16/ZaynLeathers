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

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || "Update";
}

export function shortOrderId(id) {
  return String(id || "").slice(-8).toUpperCase();
}
