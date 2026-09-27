import brand from "../brand";

const SHOP_URL = brand.contact?.websiteUrl || "";
const BRAND = brand.name || "Zayn Leathers";

/** Indian mobile → 91XXXXXXXXXX for wa.me */
export function indiaWaDigits(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 10) return `91${d}`;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  if (d.length === 12 && d.startsWith("91")) return d;
  if (d.length > 12 && d.startsWith("91")) return d.slice(0, 12);
  if (d.length >= 10) return `91${d.slice(-10)}`;
  return "";
}

export function waChatUrl(phone, text) {
  const n = indiaWaDigits(phone);
  if (!n) return "";
  const q = encodeURIComponent(text || "");
  return q ? `https://wa.me/${n}?text=${q}` : `https://wa.me/${n}`;
}

export function phoneFromOrder(order) {
  return order?.address?.phone || order?.guestPhone || "";
}

export function firstNameFrom(order, user) {
  return (
    order?.address?.firstName ||
    user?.firstName ||
    "there"
  );
}

export function orderRef(order) {
  return String(order?._id || "").slice(-8).toUpperCase();
}

export function primaryItemStatus(order) {
  const items = order?.items || [];
  if (!items.length) return "OrderPlaced";
  if (items.every((i) => i.status === "Cancelled")) return "Cancelled";
  const active = items.find((i) => i.status !== "Cancelled");
  return active?.status || items[0].status || "OrderPlaced";
}

function inr(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return "—";
  return `₹${v.toLocaleString("en-IN")}`;
}

function formatDate(order) {
  const d = order?.date || order?.createdAt;
  if (!d) return "";
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function itemLines(order, { withStatus = true } = {}) {
  return (order?.items || [])
    .slice(0, 16)
    .map((i) => {
      const status = withStatus && i.status ? ` [${labelStatus(i.status)}]` : "";
      return `• ${i.name} × ${i.quantity} (size ${i.size || "—"}) — ${inr(i.price)}${status}`;
    })
    .join("\n");
}

function paymentLine(order) {
  const method = order?.paymentMethod || "COD";
  const paid = order?.payment ? "paid" : "payment pending";
  const pd = order?.paymentDetails;
  let extra = "";
  if (method === "Partial" && pd) {
    extra = `\nAdvance: ${inr(pd.advanceAmount)} (${pd.advancePaid ? "received" : "pending"}) · Balance: ${inr(pd.balanceAmount)} (${pd.balancePaid ? "collected" : "due"})`;
  }
  return `Payment: ${method} · ${paid}${extra}`;
}

function addressBlock(order) {
  const a = order?.address || {};
  return [
    [a.firstName, a.lastName].filter(Boolean).join(" "),
    a.street,
    a.apartment,
    [a.city, a.state, a.zipcode].filter(Boolean).join(", "),
    a.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function trackingBlock(order) {
  const s = order?.shipping || {};
  const lines = [];
  if (s.courierName) lines.push(`Courier: ${s.courierName}`);
  if (s.awbCode) lines.push(`AWB: ${s.awbCode}`);
  if (s.trackingUrl) lines.push(`Track: ${s.trackingUrl}`);
  return lines.join("\n");
}

function signOff() {
  const shop = SHOP_URL ? `\nShop: ${SHOP_URL}` : "";
  return `\n— ${BRAND}${shop}\nReply here if you need anything.`;
}

export function labelStatus(status) {
  const map = {
    OrderPlaced: "Order confirmed",
    Packing: "Packing",
    Shipped: "Shipped",
    OutForDelivery: "Out for delivery",
    Delivered: "Delivered",
    Cancelled: "Cancelled",
    RTO: "Returned to origin (RTO)",
    ReturnRequested: "Return requested",
    ReturnInTransit: "Return in transit",
    Returned: "Returned",
  };
  return map[status] || status;
}

export const ORDER_WA_TEMPLATES = [
  { id: "summary", label: "Full order summary" },
  { id: "OrderPlaced", label: "Order confirmed" },
  { id: "Packing", label: "Packing" },
  { id: "Shipped", label: "Shipped" },
  { id: "OutForDelivery", label: "Out for delivery" },
  { id: "Delivered", label: "Delivered" },
  { id: "Cancelled", label: "Cancelled" },
  { id: "RTO", label: "RTO" },
  { id: "ReturnRequested", label: "Return requested" },
  { id: "ReturnInTransit", label: "Return in transit" },
  { id: "Returned", label: "Returned" },
  { id: "invoice", label: "Invoice ready (with link)" },
];

export function buildOrderWhatsAppText(order, templateId) {
  if (!order) return "";
  const name = firstNameFrom(order);
  const ref = orderRef(order);
  const items = itemLines(order);
  const pay = paymentLine(order);
  const when = formatDate(order);
  const addr = addressBlock(order);
  const track = trackingBlock(order);
  const total = inr(order.amount);
  const greet = `Hi ${name},`;
  const head = `${BRAND} · Order #${ref}${when ? `\nPlaced: ${when}` : ""}`;

  const bodies = {
    summary: `${greet}

Here are your order details from ${BRAND}.

${head}
${pay}
Total: ${total}

Items:
${items}

Ship to: ${addr}
${track ? `\n${track}` : ""}
${signOff()}`,

    OrderPlaced: `${greet}

Thank you for your order with ${BRAND}. We have received it and will start packing shortly.

${head}
${pay}
Total: ${total}

Items:
${items}

Ship to: ${addr}
${signOff()}`,

    Packing: `${greet}

Your order #${ref} is being packed at ${BRAND}.

Items:
${items}

Total: ${total}
${pay}
${signOff()}`,

    Shipped: `${greet}

Good news — order #${ref} has been shipped.

${track || "Tracking details will follow once the courier updates."}

Items:
${items}

Total: ${total}
${signOff()}`,

    OutForDelivery: `${greet}

Order #${ref} is out for delivery today. Please keep your phone reachable for the courier.

${track ? `${track}\n` : ""}Total: ${total}
${pay}
${signOff()}`,

    Delivered: `${greet}

Order #${ref} has been marked delivered. We hope you love your ${BRAND} piece.

Items:
${items}

If anything is not right, reply on this chat.
${signOff()}`,

    Cancelled: `${greet}

Order #${ref} has been cancelled.

Items:
${items}

Total: ${total}
${pay}

If this was a mistake, reply here and we will help.
${signOff()}`,

    RTO: `${greet}

Order #${ref} could not be delivered and is returning to origin (RTO).

${track ? `${track}\n` : ""}Items:
${items}

Total: ${total}
Please reply if you would like us to reship or refund as per policy.
${signOff()}`,

    ReturnRequested: `${greet}

We have your return request for order #${ref}.

${order?.shipping?.return?.reason ? `Reason: ${order.shipping.return.reason}\n` : ""}Items:
${items}

Our team will share pickup / next steps on this chat.
${signOff()}`,

    ReturnInTransit: `${greet}

The return pickup for order #${ref} is in transit.

${order?.shipping?.return?.awbCode ? `Return AWB: ${order.shipping.return.awbCode}\n` : ""}${order?.shipping?.return?.trackingUrl ? `Track: ${order.shipping.return.trackingUrl}\n` : ""}
We will update you once we receive the parcel.
${signOff()}`,

    Returned: `${greet}

We have received the return for order #${ref}. Next steps (refund / exchange) will follow as per our policy.

Items:
${items}
${signOff()}`,

    invoice: order?.invoice?.number
      ? buildDocumentShareText({
          type: "invoice",
          order,
          docNumber: order.invoice.number,
          docUrl: order.invoice.pdfUrl,
          amount: order.invoice.totals?.grandTotal ?? order.amount,
        })
      : `${greet}

Your invoice for order #${ref} is being prepared. We will share the PDF link shortly.
${signOff()}`,
  };

  return (bodies[templateId] || bodies.summary).trim();
}

export function buildDocumentShareText({ type = "invoice", order, docNumber, docUrl, amount }) {
  const name = firstNameFrom(order);
  const ref = orderRef(order);
  const total = inr(amount ?? order?.amount);
  const label = type === "credit_note" ? "Credit note" : "Invoice";

  return `Hi ${name},

Your ${label.toLowerCase()} from ${BRAND} for order #${ref} is ready.

${label} No: ${docNumber}
Amount: ${total}
${docUrl ? `\nDownload PDF:\n${docUrl}` : ""}

Please save this for your records. Reply here if you need any changes.
${signOff()}`.trim();
}

export function buildCustomerWhatsAppText(user, lastOrder) {
  const name = user?.firstName || "there";
  if (lastOrder) {
    return `Hi ${name},

This is ${BRAND}. We have your account and latest order #${orderRef(lastOrder)} (${inr(lastOrder.amount)}).

Reply here for help with your order or sizing.
${signOff()}`;
  }
  return `Hi ${name},

Welcome to ${BRAND}. We have your number on file for order updates.

Reply here anytime you need help.
${signOff()}`;
}

export function openWhatsApp(phone, text) {
  const url = waChatUrl(phone, text);
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
