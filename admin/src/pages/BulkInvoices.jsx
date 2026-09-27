import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { backendUrl } from "../App";
import { adminHeaders } from "../utils/adminApi";
import PageHeader from "../components/PageHeader";
import { useAdminFeatures } from "../context/AdminFeaturesContext";
import {
  DATE_PRESETS,
  downloadAnalyticsCsv,
  formatInr,
  resolvePreset,
} from "../utils/analyticsUi";

const PAYMENT_OPTIONS = ["COD", "Razorpay", "Partial"];

const BulkInvoices = ({ token }) => {
  const { features } = useAdminFeatures();
  const invoicingOn = features?.invoicing === true;

  const [preset, setPreset] = useState("mtd");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dateField, setDateField] = useState("order");
  const [deliveredOnly, setDeliveredOnly] = useState(true);
  const [missingInvoiceOnly, setMissingInvoiceOnly] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [minAmount, setMinAmount] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  const [loading, setLoading] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const applyPreset = useCallback((id) => {
    const r = resolvePreset(id);
    setPreset(id);
    setFrom(r.from);
    setTo(r.to);
  }, []);

  useEffect(() => {
    applyPreset("mtd");
  }, [applyPreset]);

  const filterParams = () => ({
    from,
    to,
    preset,
    dateField,
    deliveredOnly,
    missingInvoiceOnly,
    paymentMethods: paymentMethods.length ? paymentMethods.join(",") : "",
    minAmount: minAmount || "",
  });

  const runPreview = async () => {
    if (!from || !to) {
      toast.error("Choose a date range");
      return;
    }
    setLoading(true);
    setLastResult(null);
    try {
      const q = new URLSearchParams(filterParams()).toString();
      const res = await axios.get(`${backendUrl}/api/invoice/bulk/preview?${q}`, {
        headers: adminHeaders(token),
      });
      if (res.data.success) {
        setPreview(res.data);
      } else {
        toast.error(res.data.message || "Preview failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Preview failed");
    } finally {
      setLoading(false);
    }
  };

  const runBulkIssue = async () => {
    if (!preview?.summary?.eligible) {
      toast.error("No eligible orders — run preview first");
      return;
    }
    const n = preview.summary.eligible;
    if (
      !window.confirm(
        `Generate invoices for up to ${Math.min(n, 100)} of ${n} eligible orders in this filter?`
      )
    ) {
      return;
    }
    setIssuing(true);
    try {
      const res = await axios.post(
        `${backendUrl}/api/invoice/bulk/issue`,
        { ...filterParams(), sendEmail, limit: 100 },
        { headers: adminHeaders(token) }
      );
      if (res.data.success) {
        setLastResult(res.data);
        toast.success(`Issued ${res.data.issued} invoice(s)`);
        runPreview();
      } else {
        toast.error(res.data.message || "Bulk issue failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk issue failed");
    } finally {
      setIssuing(false);
    }
  };

  const downloadAccounting = () => {
    const q = new URLSearchParams({ from, to }).toString();
    downloadAnalyticsCsv(
      `${backendUrl}/api/invoice/export/accounting?${q}`,
      token,
      `accounting-${from}-${to}.csv`
    ).catch(() => toast.error("Accounting export failed"));
  };

  const togglePayment = (method) => {
    setPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  if (!invoicingOn) {
    return (
      <div className="max-w-2xl">
        <PageHeader title="Bulk invoices" subtitle="Generate invoices for delivered orders in a date range." />
        <p className="text-sm text-gray-500 mt-4">
          Invoicing module is off. Set <code className="bg-gray-100 px-1 rounded">FEATURE_INVOICING=true</code> in
          backend .env and restart.
        </p>
      </div>
    );
  }

  const summary = preview?.summary;

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Bulk invoice generation"
        subtitle="Filter by week, month, or custom dates — preview totals, then generate missing invoices for accounting."
      />

      <div className="bg-white border border-tz-pink-soft rounded-2xl p-5 space-y-5">
        <div>
          <p className="text-xs font-semibold text-tz-navy/50 uppercase tracking-wide mb-2">Date range</p>
          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  preset === p.id
                    ? "bg-tz-navy text-white border-tz-navy"
                    : "border-tz-pink-soft text-tz-navy/70 hover:bg-tz-cream"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            <div>
              <label className="text-xs font-medium text-tz-navy/60">From</label>
              <input
                type="date"
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPreset("custom");
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-tz-navy/60">To</label>
              <input
                type="date"
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPreset("custom");
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-tz-navy/60">Date axis</label>
              <select
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm bg-white"
                value={dateField}
                onChange={(e) => setDateField(e.target.value)}
              >
                <option value="order">Order date</option>
                <option value="delivered">Delivery date</option>
                <option value="issued">Invoice issued</option>
              </select>
            </div>
          </div>
          {dateField === "delivered" && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
              Delivery date uses <code className="text-[11px]">deliveredAt</code>. Run{" "}
              <code className="text-[11px]">node backend/scripts/backfillDeliveredAt.js</code> once for older orders.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={deliveredOnly}
              onChange={(e) => setDeliveredOnly(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            Fully delivered only
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={missingInvoiceOnly}
              onChange={(e) => setMissingInvoiceOnly(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            Missing invoice only
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            Email customers after each invoice
          </label>
        </div>

        <div>
          <p className="text-xs font-semibold text-tz-navy/50 uppercase tracking-wide mb-2">Payment method</p>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => togglePayment(m)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  paymentMethods.includes(m)
                    ? "bg-tz-pink-soft border-tz-pink text-tz-navy"
                    : "border-gray-200 text-tz-navy/60"
                }`}
              >
                {m}
              </button>
            ))}
            <span className="text-xs text-tz-navy/40 self-center">Leave empty = all methods</span>
          </div>
        </div>

        <div className="max-w-xs">
          <label className="text-xs font-medium text-tz-navy/60">Min order amount (₹)</label>
          <input
            type="number"
            className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Optional"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runPreview}
            disabled={loading}
            className="bg-tz-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Loading…" : "Preview eligible orders"}
          </button>
          <button
            type="button"
            onClick={runBulkIssue}
            disabled={issuing || !preview?.summary?.eligible}
            className="bg-tz-pink text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {issuing ? "Generating…" : "Generate invoices"}
          </button>
          <button
            type="button"
            onClick={downloadAccounting}
            className="border border-tz-navy/20 px-5 py-2.5 rounded-xl text-sm font-semibold"
          >
            Download accounting CSV
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border rounded-2xl p-4">
            <p className="text-xs text-tz-navy/50">Eligible</p>
            <p className="text-2xl font-semibold text-tz-navy">{summary.eligible}</p>
          </div>
          <div className="bg-white border rounded-2xl p-4">
            <p className="text-xs text-tz-navy/50">Total value</p>
            <p className="text-2xl font-semibold text-tz-navy">{formatInr(summary.totalAmount)}</p>
          </div>
          <div className="bg-white border rounded-2xl p-4">
            <p className="text-xs text-tz-navy/50">Already invoiced</p>
            <p className="text-2xl font-semibold text-tz-navy">{summary.skippedAlreadyInvoiced}</p>
          </div>
          <div className="bg-white border rounded-2xl p-4">
            <p className="text-xs text-tz-navy/50">Not delivered</p>
            <p className="text-2xl font-semibold text-tz-navy">{summary.skippedNotDelivered}</p>
          </div>
        </div>
      )}

      {preview?.orders?.length > 0 && (
        <div className="bg-white border border-tz-pink-soft rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <h3 className="font-semibold text-sm text-tz-navy">
              Preview ({preview.eligibleTotal} eligible
              {preview.listCapped ? `, showing first ${preview.orders.length}` : ""})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-tz-cream/80 text-left text-xs text-tz-navy/50">
                <tr>
                  <th className="px-4 py-2">Order</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Payment</th>
                  <th className="px-4 py-2">Delivered</th>
                </tr>
              </thead>
              <tbody>
                {preview.orders.map((row) => (
                  <tr key={row.orderId} className="border-t border-gray-100">
                    <td className="px-4 py-2">
                      <Link to={`/orders/${row.orderId}`} className="font-semibold text-tz-navy underline">
                        #{row.shortId}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{row.customer}</td>
                    <td className="px-4 py-2">{formatInr(row.amount)}</td>
                    <td className="px-4 py-2">{row.paymentMethod}</td>
                    <td className="px-4 py-2">
                      {row.deliveredAt
                        ? new Date(row.deliveredAt).toLocaleDateString("en-IN")
                        : row.fullyDelivered
                          ? "Yes*"
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lastResult && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-sm space-y-1">
          <p className="font-semibold text-emerald-900">Bulk run complete</p>
          <p>
            Issued: {lastResult.issued} · Skipped: {lastResult.skipped} · Failed: {lastResult.failed}
            {lastResult.remainingEligible > 0
              ? ` · ${lastResult.remainingEligible} still eligible (run again for next batch)`
              : ""}
          </p>
          {lastResult.failures?.length > 0 && (
            <ul className="text-red-700 text-xs mt-2 list-disc pl-4">
              {lastResult.failures.map((f) => (
                <li key={f.orderId}>
                  {String(f.orderId).slice(-8)}: {f.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkInvoices;
