import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";
import { adminHeaders } from "../utils/adminApi";
import {
  buildDocumentShareText,
  openWhatsApp,
  phoneFromOrder,
} from "../utils/whatsapp";
import { isWhatsAppEnabled, useAdminFeatures } from "../context/AdminFeaturesContext";

const OrderInvoicePanel = ({ order, token, onUpdated }) => {
  const { features } = useAdminFeatures();
  const invoicingOn = features?.invoicing === true;
  const whatsappOn = isWhatsAppEnabled(features);

  const [busy, setBusy] = useState(false);
  const [cnReason, setCnReason] = useState("Return / refund");
  const [cnAmount, setCnAmount] = useState(String(order?.amount || ""));

  if (!invoicingOn) return null;

  const inv = order?.invoice || {};
  const hasInvoice = Boolean(inv.number);

  const downloadUrl = `${backendUrl}/api/invoice/admin/${order._id}/pdf`;

  const issue = async (force = false) => {
    setBusy(true);
    try {
      const res = await axios.post(
        `${backendUrl}/api/invoice/issue/${order._id}`,
        { force },
        { headers: adminHeaders(token) }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Invoice ready");
        onUpdated?.();
      } else toast.error(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not generate invoice");
    } finally {
      setBusy(false);
    }
  };

  const issueCreditNote = async () => {
    setBusy(true);
    try {
      const res = await axios.post(
        `${backendUrl}/api/invoice/credit-note/${order._id}`,
        { reason: cnReason, amount: Number(cnAmount) },
        { headers: adminHeaders(token) }
      );
      if (res.data.success) {
        toast.success("Credit note issued");
        onUpdated?.();
      } else toast.error(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Credit note failed");
    } finally {
      setBusy(false);
    }
  };

  const shareWhatsApp = (docType = "invoice") => {
    const phone = phoneFromOrder(order);
    const latestCn = (order.creditNotes || []).slice(-1)[0];
    const text =
      docType === "credit_note" && latestCn
        ? buildDocumentShareText({
            type: "credit_note",
            order,
            docNumber: latestCn.number,
            docUrl: latestCn.pdfUrl,
            amount: latestCn.amount,
          })
        : buildDocumentShareText({
            type: "invoice",
            order,
            docNumber: inv.number,
            docUrl: inv.pdfUrl,
            amount: inv.totals?.grandTotal ?? order.amount,
          });

    if (!text) {
      toast.error("Generate the document first");
      return;
    }
    if (!openWhatsApp(phone, text)) {
      toast.error("No valid customer phone");
    } else {
      toast.success("WhatsApp opened — tap Send");
    }
  };

  const exportAccounting = async () => {
    const from = new Date(order.date || order.createdAt);
    from.setDate(from.getDate() - 7);
    const to = new Date(order.date || order.createdAt);
    to.setDate(to.getDate() + 7);
    const q = `from=${from.toISOString().slice(0, 10)}&to=${to.toISOString().slice(0, 10)}`;
    try {
      const res = await axios.get(`${backendUrl}/api/invoice/export/accounting?${q}`, {
        headers: adminHeaders(token),
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `accounting-${from.toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-tz-pink-soft p-5 no-print space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-tz-navy">Documents</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Professional invoice or bill (GST optional). PDF stored on Cloudinary when configured.
          </p>
        </div>
        <button
          type="button"
          onClick={exportAccounting}
          className="text-xs font-semibold underline text-tz-navy/70"
        >
          Accounting CSV
        </button>
      </div>

      {hasInvoice ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium">{inv.number}</span>
          <span className="text-gray-500">
            {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString("en-IN") : ""}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-tz-cream">
            {inv.type === "tax_invoice" ? "Tax invoice" : "Bill"}
          </span>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold underline"
            onClick={(e) => {
              e.preventDefault();
              axios
                .get(downloadUrl, { headers: adminHeaders(token), responseType: "blob" })
                .then((res) => {
                  const url = URL.createObjectURL(res.data);
                  window.open(url, "_blank");
                })
                .catch(() => toast.error("Could not open PDF"));
            }}
          >
            Download PDF
          </a>
          {inv.pdfUrl && (
            <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="text-xs underline text-gray-500">
              Direct link
            </a>
          )}
          {whatsappOn && (
            <button
              type="button"
              onClick={() => shareWhatsApp("invoice")}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#25D366] text-white"
            >
              Share on WhatsApp
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => issue(true)}
            className="text-xs underline disabled:opacity-50"
          >
            Re-issue
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => issue(false)}
          className="px-4 py-2 rounded-xl bg-tz-navy text-white text-sm font-semibold disabled:opacity-50"
        >
          {busy ? "Generating…" : "Generate invoice"}
        </button>
      )}

      {(order.creditNotes || []).length > 0 && (
        <div className="text-sm space-y-2 border-t pt-3">
          <p className="font-medium text-tz-navy">Credit notes</p>
          {(order.creditNotes || []).map((cn) => (
            <div key={cn.number} className="flex flex-wrap gap-2 items-center text-xs">
              <span>{cn.number}</span>
              <span className="text-gray-500">Rs.{cn.amount}</span>
              {cn.pdfUrl && (
                <a href={cn.pdfUrl} target="_blank" rel="noreferrer" className="underline">
                  PDF
                </a>
              )}
            </div>
          ))}
          {whatsappOn && (
            <button
              type="button"
              onClick={() => shareWhatsApp("credit_note")}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#25D366] text-white"
            >
              Share latest credit note on WhatsApp
            </button>
          )}
        </div>
      )}

      <div className="border-t pt-3 space-y-2">
        <p className="text-xs font-semibold text-tz-navy">Issue credit note</p>
        <div className="grid sm:grid-cols-2 gap-2">
          <input
            className="border rounded-lg px-2 py-1.5 text-sm"
            value={cnReason}
            onChange={(e) => setCnReason(e.target.value)}
            placeholder="Reason"
          />
          <input
            className="border rounded-lg px-2 py-1.5 text-sm"
            type="number"
            value={cnAmount}
            onChange={(e) => setCnAmount(e.target.value)}
            placeholder="Amount (Rs)"
          />
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={issueCreditNote}
          className="text-xs font-semibold border border-tz-navy px-3 py-1.5 rounded-lg disabled:opacity-50"
        >
          Issue credit note
        </button>
      </div>

      {order.billing?.gstin && (
        <p className="text-xs text-gray-500">Buyer GSTIN: {order.billing.gstin}</p>
      )}
    </section>
  );
};

export default OrderInvoicePanel;
