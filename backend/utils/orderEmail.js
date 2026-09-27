import brand from "../../shared/brand.config.js";
import { isFeatureEnabled } from "../config/features.js";
import { resolveInvoiceConfig } from "./invoicing/invoiceConfig.js";
import { sendEmail } from "./mailer.js";

export function buildOrderDetailUrl(orderId) {
  const base = String(process.env.FRONTEND_URL || "").replace(/\/$/, "");
  if (!base || !orderId) return "";
  return `${base}/orders/${orderId}`;
}

export async function buildInvoiceNoteHtml() {
  if (!isFeatureEnabled("invoicing")) return "";
  try {
    const config = await resolveInvoiceConfig();
    if (!config.enabled) return "";
  } catch {
    return "";
  }
  const ordersUrl = String(process.env.FRONTEND_URL || "").replace(/\/$/, "");
  const accountOrdersLink = ordersUrl ? `${ordersUrl}/orders` : "";
  const accountPart = accountOrdersLink
    ? `<a href="${accountOrdersLink}">My Account → Orders</a>`
    : "My Account → Orders";
  return `
    <p style="margin-top:12px;font-size:14px;color:#444;">
      Your tax invoice / receipt will be available in ${accountPart} after delivery.
      We'll email you when it's ready to download.
    </p>
  `;
}

/**
 * Shared HTML body for customer order confirmation / payment success emails.
 */
export async function buildCustomerOrderEmailHtml({
  greetingName,
  introHtml,
  orderId,
  orderTable,
  extraHtml = "",
  deliveryNote = "Delivery in 7–10 working days",
}) {
  const orderUrl = buildOrderDetailUrl(orderId);
  const invoiceNote = await buildInvoiceNoteHtml();
  const viewOrderBlock = orderUrl
    ? `<p style="margin:16px 0;"><a href="${orderUrl}" style="display:inline-block;padding:10px 18px;background:#1c1917;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">View order details</a></p>
       <p style="font-size:12px;color:#666;">Or open: <a href="${orderUrl}">${orderUrl}</a></p>`
    : `<p><b>Order ID:</b> ${orderId}</p>`;

  return `
    <h2>Hello ${greetingName || "there"}</h2>
    ${introHtml}
    ${viewOrderBlock}
    <h3 style="margin-top:20px;">Order items</h3>
    ${orderTable}
    <p>🚚 ${deliveryNote}</p>
    ${invoiceNote}
    ${extraHtml}
    <p style="margin-top:24px;font-size:12px;color:#888;">— ${brand.name || brand.email?.fromName || "Zayn Leathers"}</p>
  `;
}

export async function sendCustomerOrderEmail({ to, subject, html }) {
  if (!to) return;
  await sendEmail({ to, subject, html });
}
