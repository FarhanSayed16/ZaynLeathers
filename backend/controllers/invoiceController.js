import SiteSettings from "../models/SiteSettings.js";
import orderModel from "../models/orderModel.js";
import {
  resolveInvoiceConfig,
  sellerHasGst,
} from "../utils/invoicing/invoiceConfig.js";
import {
  customerCanDownloadInvoice,
  emailInvoiceToCustomer,
  issueInvoiceForOrder,
  orderHasActiveItems,
} from "../utils/invoicing/issueInvoiceForOrder.js";
import {
  executeBulkIssue,
  previewBulkInvoices,
} from "../utils/invoicing/bulkInvoice.js";
import { renderCreditNotePdf } from "../utils/invoicing/renderPdf.js";
import { nextDocumentNumber } from "../utils/invoicing/sequences.js";
import { fetchPdfBuffer, uploadPdfBuffer } from "../utils/invoicing/uploadPdf.js";

function escapeCsv(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function streamPdfResponse(res, pdfUrl, filename) {
  if (!pdfUrl) {
    return res.status(404).json({ success: false, message: "PDF not found" });
  }
  try {
    const buffer = await fetchPdfBuffer(pdfUrl);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    return res.send(buffer);
  } catch {
    return res.status(502).json({ success: false, message: "Could not load PDF" });
  }
}

export const getInvoiceConfig = async (_req, res) => {
  try {
    const config = await resolveInvoiceConfig();
    res.json({ success: true, config, hasGst: sellerHasGst(config) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInvoiceConfig = async (req, res) => {
  try {
    const incoming = req.body?.invoiceConfig || req.body || {};
    const existing = await SiteSettings.findOne({ singleton: "default" }).lean();
    const merged = {
      ...(existing?.invoiceConfig || {}),
      ...incoming,
    };
    const settings = await SiteSettings.findOneAndUpdate(
      { singleton: "default" },
      { $set: { invoiceConfig: merged } },
      { upsert: true, returnDocument: "after" }
    );
    const config = await resolveInvoiceConfig();
    res.json({
      success: true,
      message: "Invoice settings saved",
      config,
      invoiceConfig: settings.invoiceConfig,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const issueInvoice = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!orderHasActiveItems(order)) {
      return res.status(400).json({ success: false, message: "No billable items on this order" });
    }

    if (order.invoice?.number && !req.body?.force) {
      return res.json({
        success: true,
        message: "Invoice already issued",
        invoice: order.invoice,
        orderId: order._id,
      });
    }

    const result = await issueInvoiceForOrder(order, { force: Boolean(req.body?.force) });
    if (!result.ok) {
      const msg =
        result.reason === "config_paused"
          ? "Invoice generation is paused in settings"
          : result.reason === "invoicing_disabled"
            ? "Invoicing module is disabled"
            : "Could not generate invoice";
      return res.status(result.reason === "config_paused" ? 409 : 400).json({
        success: false,
        message: msg,
      });
    }
    if (result.skipped && result.reason === "already_issued") {
      return res.json({
        success: true,
        message: "Invoice already issued",
        invoice: result.invoice,
        orderId: order._id,
      });
    }

    const config = result.config || (await resolveInvoiceConfig());
    try {
      await emailInvoiceToCustomer(order, config);
    } catch (mailErr) {
      console.error("invoice email:", mailErr.message);
    }

    res.json({
      success: true,
      message: "Invoice generated",
      invoice: result.invoice,
      orderId: order._id,
    });
  } catch (error) {
    console.error("issueInvoice:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminInvoicePdf = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.orderId);
    if (!order?.invoice?.pdfUrl) {
      return res.status(404).json({ success: false, message: "Invoice not issued yet" });
    }
    return streamPdfResponse(res, order.invoice.pdfUrl, `${order.invoice.number}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerInvoicePdf = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (String(order.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your order" });
    }

    const config = await resolveInvoiceConfig();
    if (!customerCanDownloadInvoice(order, config)) {
      return res.status(403).json({
        success: false,
        message: "Invoice will be available once your order is delivered",
      });
    }
    if (!order.invoice?.pdfUrl) {
      return res.status(404).json({ success: false, message: "Invoice PDF not ready yet" });
    }

    return streamPdfResponse(res, order.invoice.pdfUrl, `${order.invoice.number}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerCreditNotePdf = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (String(order.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your order" });
    }

    const cnNumber = decodeURIComponent(req.params.cnNumber || "");
    const entry = (order.creditNotes || []).find((c) => c.number === cnNumber);
    if (!entry?.pdfUrl) {
      return res.status(404).json({ success: false, message: "Credit note not found" });
    }

    return streamPdfResponse(res, entry.pdfUrl, `${entry.number}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const issueCreditNote = async (req, res) => {
  try {
    const config = await resolveInvoiceConfig();
    const order = await orderModel.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const { reason = "Return / adjustment", amount: rawAmount } = req.body || {};
    let amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      amount = Number(order.amount) || 0;
    }

    const cnNumber = await nextDocumentNumber(config.creditNotePrefix);
    const pdfBuffer = await renderCreditNotePdf({
      order,
      config,
      creditNoteNumber: cnNumber,
      reason,
      amount,
      invoiceNumber: order.invoice?.number || "",
    });

    const upload = await uploadPdfBuffer(pdfBuffer, {
      folder: "credit-notes",
      publicId: `cn-${String(order._id)}-${Date.now()}`,
    });

    const entry = {
      number: cnNumber,
      issuedAt: new Date(),
      reason,
      amount,
      pdfUrl: upload.secure_url,
    };

    order.creditNotes = order.creditNotes || [];
    order.creditNotes.push(entry);
    await order.save();

    res.json({ success: true, message: "Credit note issued", creditNote: entry });
  } catch (error) {
    console.error("issueCreditNote:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportAccountingCsv = async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 86400000);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    to.setHours(23, 59, 59, 999);

    const orders = await orderModel
      .find({
        "invoice.issuedAt": { $gte: from, $lte: to },
        "invoice.number": { $ne: "" },
      })
      .sort({ "invoice.issuedAt": 1 })
      .lean();

    const config = await resolveInvoiceConfig();
    const hasGst = sellerHasGst(config);

    const header = [
      "Date",
      "InvoiceNo",
      "DocumentType",
      "OrderId",
      "Customer",
      "Phone",
      "State",
      "BuyerGSTIN",
      ...(hasGst ? ["HSN", "Taxable", "CGST", "SGST", "IGST"] : ["Subtotal"]),
      "GrandTotal",
      "PaymentMethod",
      "Paid",
      "CouponCode",
      "PdfUrl",
    ];

    const rows = orders.map((o) => {
      const a = o.address || {};
      const inv = o.invoice || {};
      const t = inv.totals || {};
      const base = [
        inv.issuedAt ? new Date(inv.issuedAt).toISOString().slice(0, 10) : "",
        inv.number,
        inv.type === "tax_invoice" ? "Tax Invoice" : "Bill",
        o._id,
        `${a.firstName || ""} ${a.lastName || ""}`.trim(),
        a.phone || o.guestPhone,
        a.state,
        o.billing?.gstin || "",
      ];
      if (hasGst) {
        base.push(config.defaultHsn, t.taxable, t.cgst, t.sgst, t.igst);
      } else {
        base.push(t.grandTotal ?? o.amount);
      }
      base.push(
        t.grandTotal ?? o.amount,
        o.paymentMethod,
        o.payment ? "yes" : "no",
        o.couponCode || "",
        inv.pdfUrl || ""
      );
      return base.map(escapeCsv).join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="accounting-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.csv"`
    );
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoiceShareMeta = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.orderId).select("invoice creditNotes amount");
    if (!order?.invoice?.number) {
      return res.status(404).json({ success: false, message: "No invoice" });
    }
    res.json({
      success: true,
      invoice: {
        number: order.invoice.number,
        pdfUrl: order.invoice.pdfUrl,
        issuedAt: order.invoice.issuedAt,
        amount: order.invoice.totals?.grandTotal ?? order.amount,
      },
      creditNotes: order.creditNotes || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkPreviewInvoices = async (req, res) => {
  try {
    const data = await previewBulkInvoices(orderModel, req.query);
    res.json(data);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const bulkIssueInvoices = async (req, res) => {
  try {
    const data = await executeBulkIssue(orderModel, req.body || {});
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
