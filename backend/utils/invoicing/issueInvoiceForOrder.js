import orderModel from "../../models/orderModel.js";
import userModel from "../../models/userModel.js";
import { isFeatureEnabled } from "../../config/features.js";
import { resolveInvoiceConfig, sellerHasGst } from "./invoiceConfig.js";
import { buildInvoiceLines } from "./gstBreakdown.js";
import { nextDocumentNumber } from "./sequences.js";
import { renderInvoicePdf } from "./renderPdf.js";
import { uploadPdfBuffer } from "./uploadPdf.js";
import { sendEmail } from "../mailer.js";
import brand from "../../../shared/brand.config.js";

export function orderHasActiveItems(order) {
  return (order.items || []).some((i) => i.status !== "Cancelled");
}

export function orderIsFullyDelivered(order) {
  const active = (order.items || []).filter((i) => i.status !== "Cancelled");
  return active.length > 0 && active.every((i) => i.status === "Delivered");
}

export function customerCanDownloadInvoice(order, config) {
  if (!order.invoice?.number) return false;
  if (config.allowCustomerDownloadBeforeDelivered) return true;
  return (order.items || []).some((i) => i.status === "Delivered");
}

/**
 * Generate invoice PDF for an order. Persists invoice on the order document.
 */
export async function issueInvoiceForOrder(order, { force = false } = {}) {
  if (!isFeatureEnabled("invoicing")) {
    return { ok: false, skipped: true, reason: "invoicing_disabled" };
  }

  const config = await resolveInvoiceConfig();
  if (!config.enabled) {
    return { ok: false, skipped: true, reason: "config_paused" };
  }
  if (!orderHasActiveItems(order)) {
    return { ok: false, skipped: true, reason: "no_billable_items" };
  }
  if (order.invoice?.number && !force) {
    return { ok: true, skipped: true, reason: "already_issued", invoice: order.invoice };
  }

  const breakdown = buildInvoiceLines(order, config);
  const docType = sellerHasGst(config) ? "tax_invoice" : "bill";
  const invoiceNumber = await nextDocumentNumber(config.invoicePrefix);

  const pdfBuffer = await renderInvoicePdf({
    order,
    config,
    invoiceNumber,
    docType,
    breakdown,
  });

  const upload = await uploadPdfBuffer(pdfBuffer, {
    folder: "invoices",
    publicId: `inv-${String(order._id)}-${Date.now()}`,
  });

  order.invoice = {
    number: invoiceNumber,
    issuedAt: new Date(),
    type: docType,
    pdfUrl: upload.secure_url,
    totals: breakdown.totals,
    sellerSnapshot: { ...config },
  };
  await order.save();

  return { ok: true, invoice: order.invoice, config };
}

export async function emailInvoiceToCustomer(order, config) {
  if (config.emailCustomerOnInvoice === false) return { sent: false };
  if (!order.invoice?.pdfUrl) return { sent: false };

  let email = order.address?.email;
  let name = order.address?.firstName || "";
  if (order.userId) {
    const user = await userModel.findById(order.userId).select("email firstName name");
    email = user?.email || email;
    name = user?.firstName || user?.name || name;
  }
  if (!email) return { sent: false };

  const shortId = String(order._id).slice(-8);
  const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
  const orderUrl = frontendUrl ? `${frontendUrl}/orders/${order._id}` : "";
  const amount = order.invoice.totals?.grandTotal ?? order.amount;

  await sendEmail({
    to: email,
    subject:
      brand.email?.invoiceReadySubject ||
      `Your invoice ${order.invoice.number} — ${brand.name || "Zayn Leathers"}`,
    html: `
      <h2>Hello ${name || "there"}</h2>
      <p>Your invoice <b>${order.invoice.number}</b> for order <b>#${shortId}</b> is ready.</p>
      <p><b>Total:</b> ₹${amount}</p>
      <p><a href="${order.invoice.pdfUrl}">Download invoice PDF</a></p>
      ${orderUrl ? `<p>You can also view this order in <a href="${orderUrl}">My account → Orders</a>.</p>` : ""}
      <p style="color:#666;font-size:12px;">This is your receipt / tax document for this purchase.</p>
    `,
  });
  return { sent: true };
}

/** Auto-issue when all active line items are Delivered (if enabled in invoice settings). */
export async function maybeAutoInvoiceAfterDelivery(orderId) {
  try {
    const order = await orderModel.findById(orderId);
    if (!order || !orderIsFullyDelivered(order)) return;

    if (!order.deliveredAt) {
      order.deliveredAt = new Date();
      await order.save();
    }

    if (order.invoice?.number) return;

    const config = await resolveInvoiceConfig();
    if (
      !isFeatureEnabled("invoicing") ||
      !config.enabled ||
      config.autoGenerateOnDelivered === false
    ) {
      return;
    }

    const result = await issueInvoiceForOrder(order);
    if (result.ok && !result.skipped) {
      await emailInvoiceToCustomer(order, config);
    }
  } catch (err) {
    console.error("maybeAutoInvoiceAfterDelivery:", err.message);
  }
}
