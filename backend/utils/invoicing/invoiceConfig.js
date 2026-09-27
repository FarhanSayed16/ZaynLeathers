import brand from "../../../shared/brand.config.js";
import SiteSettings from "../../models/SiteSettings.js";

export function normalizeState(state) {
  return String(state || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function getFinancialYear(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  if (month >= 3) {
    return `${String(year).slice(-2)}${String(year + 1).slice(-2)}`;
  }
  return `${String(year - 1).slice(-2)}${String(year).slice(-2)}`;
}

export function isValidGstin(gstin) {
  const v = String(gstin || "").trim().toUpperCase();
  if (!v) return true;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v);
}

export async function resolveInvoiceConfig() {
  const settings = await SiteSettings.findOne({ singleton: "default" }).lean();
  const cfg = settings?.invoiceConfig || {};
  const contact = brand.contact || {};

  return {
    enabled: cfg.enabled !== false,
    legalName: cfg.legalName || brand.legalName || brand.name,
    tradeName: cfg.tradeName || brand.name,
    address: cfg.address || contact.address || "",
    city: cfg.city || "",
    state: cfg.state || "Maharashtra",
    pincode: cfg.pincode || "",
    phone: cfg.phone || contact.phone || "",
    email: cfg.email || contact.email || "",
    gstin: String(cfg.gstin || "").trim().toUpperCase(),
    pan: String(cfg.pan || "").trim().toUpperCase(),
    defaultHsn: cfg.defaultHsn || "4203",
    invoicePrefix: cfg.invoicePrefix || "INV",
    creditNotePrefix: cfg.creditNotePrefix || "CN",
    defaultGstRate: Number(cfg.defaultGstRate) || 12,
    pricesIncludeGst: cfg.pricesIncludeGst !== false,
    footerNotes:
      cfg.footerNotes ||
      "Thank you for your purchase. This is a computer-generated document.",
    bankDetails: cfg.bankDetails || "",
    showPaymentIds: cfg.showPaymentIds !== false,
    allowCustomerDownloadBeforeDelivered: Boolean(cfg.allowCustomerDownloadBeforeDelivered),
    autoGenerateOnDelivered: cfg.autoGenerateOnDelivered !== false,
    emailCustomerOnInvoice: cfg.emailCustomerOnInvoice !== false,
  };
}

export function sellerHasGst(config) {
  return Boolean(config?.gstin);
}

export function parseBillingInput(body = {}) {
  const billing = body.billing || body;
  return {
    gstin: String(billing.gstin || "").trim().toUpperCase(),
    companyName: String(billing.companyName || "").trim(),
  };
}
