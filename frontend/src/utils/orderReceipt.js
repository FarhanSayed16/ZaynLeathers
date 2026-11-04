import { normalizeOrderStatus } from "./orderStatus";

/** Active line items subtotal (excludes cancelled). */
export function orderItemsSubtotal(order) {
  return (order?.items || [])
    .filter((i) => normalizeOrderStatus(i.status || order?.status) !== "Cancelled")
    .reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
}

export function paymentMethodLabel(method) {
  const m = String(method || "").toLowerCase();
  if (m === "cod") return "Cash on delivery";
  if (m === "razorpay") return "Online (Razorpay)";
  if (m === "partial") return "Partial payment";
  return method || "—";
}

export function orderHasDeliveredItem(order) {
  if (normalizeOrderStatus(order?.status) === "Delivered") return true;
  return (order?.items || []).some(
    (i) => normalizeOrderStatus(i.status || order?.status) === "Delivered"
  );
}

export function orderIsFullyDelivered(order) {
  if (normalizeOrderStatus(order?.status) === "Delivered") return true;
  const active = (order?.items || []).filter(
    (i) => normalizeOrderStatus(i.status || order?.status) !== "Cancelled"
  );
  return (
    active.length > 0 &&
    active.every((i) => normalizeOrderStatus(i.status || order?.status) === "Delivered")
  );
}

export function customerInvoiceState(order, settings) {
  const invoicingOn = settings?.features?.invoicing === true;
  if (!invoicingOn) return { kind: "off" };

  const hasInvoice = Boolean(order?.invoice?.number);
  const allowEarly = settings?.invoicePublicConfig?.allowCustomerDownloadBeforeDelivered;
  const delivered = orderHasDeliveredItem(order);
  const canDownload = hasInvoice && (delivered || allowEarly);

  if (canDownload) {
    return {
      kind: "ready",
      number: order.invoice.number,
      label: order.invoice.type === "tax_invoice" ? "Tax invoice" : "Invoice / receipt",
    };
  }

  if (hasInvoice && !delivered && !allowEarly) {
    return {
      kind: "issued_pending_delivery",
      number: order.invoice.number,
      message: "Invoice generated — download unlocks once your order is delivered.",
    };
  }

  if (orderIsFullyDelivered(order)) {
    return {
      kind: "generating",
      message: "Your invoice is being prepared. Check back shortly or watch your email.",
    };
  }

  return {
    kind: "pending",
    message: "Invoice / receipt will be available after delivery.",
  };
}
