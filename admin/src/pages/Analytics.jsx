import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { backendUrl } from "../App";
import { adminHeaders } from "../utils/adminApi";
import PageHeader from "../components/PageHeader";
import { useAdminFeatures } from "../context/AdminFeaturesContext";
import {
  compareRange,
  DATE_PRESETS,
  downloadAnalyticsCsv,
  formatInr,
  pctBadge,
  resolvePreset,
} from "../utils/analyticsUi";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

const KpiCard = ({ label, value, delta, loading }) => (
  <div className="bg-white rounded-2xl border border-tz-pink-soft p-4">
    <p className="text-xs font-semibold text-tz-navy/50 uppercase tracking-wide">{label}</p>
    {loading ? (
      <div className="h-8 mt-2 bg-tz-navy/5 rounded animate-pulse" />
    ) : (
      <>
        <p className="text-2xl font-display font-semibold text-tz-navy mt-1">{value}</p>
        {delta != null && (
          <p className={`text-xs font-semibold mt-1 ${delta.up ? "text-[#4c8c7b]" : "text-tz-cherry"}`}>
            {delta.text} vs prior period
          </p>
        )}
      </>
    )}
  </div>
);

const Analytics = ({ token }) => {
  const { features } = useAdminFeatures();
  const analyticsOn = features?.analyticsPro === true;
  const invoicingOn = features?.invoicing === true;

  const [preset, setPreset] = useState("30d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [compare, setCompare] = useState(true);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [digest, setDigest] = useState({ enabled: false, email: "", lastSentAt: null });
  const [digestSaving, setDigestSaving] = useState(false);
  const [digestSending, setDigestSending] = useState(false);

  const applyPreset = useCallback((id) => {
    const r = resolvePreset(id);
    setPreset(id);
    setFrom(r.from);
    setTo(r.to);
  }, []);

  useEffect(() => {
    applyPreset("30d");
  }, [applyPreset]);

  const load = useCallback(async () => {
    if (!token || !from || !to || !analyticsOn) return;
    setLoading(true);
    try {
      const params = { from, to };
      if (compare) {
        const c = compareRange(from, to);
        params.compareFrom = c.compareFrom;
        params.compareTo = c.compareTo;
      }
      const headers = adminHeaders(token);
      const [sumRes, prodRes, coupRes] = await Promise.all([
        axios.get(`${backendUrl}/api/analytics/summary`, { params, headers }),
        axios.get(`${backendUrl}/api/analytics/products`, { params: { from, to, limit: 8 }, headers }),
        axios.get(`${backendUrl}/api/analytics/coupons`, { params: { from, to }, headers }),
      ]);
      if (sumRes.data.success) setSummary(sumRes.data);
      if (prodRes.data.success) setProducts(prodRes.data.products || []);
      if (coupRes.data.success) setCoupons(coupRes.data.coupons || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load analytics");
    } finally {
      setLoading(false);
    }
  }, [token, from, to, compare, analyticsOn]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!token || !analyticsOn) return;
    axios
      .get(`${backendUrl}/api/analytics/digest/settings`, { headers: adminHeaders(token) })
      .then((res) => {
        if (res.data.success) setDigest(res.data.digest || {});
      })
      .catch(() => {});
  }, [token, analyticsOn]);

  const saveDigest = async () => {
    setDigestSaving(true);
    try {
      const res = await axios.put(
        `${backendUrl}/api/analytics/digest/settings`,
        { enabled: digest.enabled, email: digest.email },
        { headers: adminHeaders(token) }
      );
      if (res.data.success) {
        setDigest(res.data.digest);
        toast.success("Digest settings saved");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save digest settings");
    } finally {
      setDigestSaving(false);
    }
  };

  const sendDigestNow = async () => {
    setDigestSending(true);
    try {
      const res = await axios.post(
        `${backendUrl}/api/analytics/digest/run?force=1`,
        {},
        { headers: adminHeaders(token) }
      );
      if (res.data.success) {
        toast.success(`Digest sent to ${res.data.sentTo}`);
        setDigest((d) => ({ ...d, lastSentAt: new Date().toISOString() }));
      } else {
        toast.info(res.data.message || "Digest was not sent");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send digest");
    } finally {
      setDigestSending(false);
    }
  };

  const cur = summary?.current;
  const deltas = summary?.deltas;

  const revenueChart = useMemo(() => {
    const labels = cur?.dailyRevenue?.map((d) => d.date.slice(5)) || [];
    const data = cur?.dailyRevenue?.map((d) => d.revenue) || [];
    const prev = summary?.previous?.dailyRevenue || [];
    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data,
          borderColor: "#6B3A2A",
          backgroundColor: "rgba(107, 58, 42, 0.12)",
          fill: true,
          tension: 0.3,
        },
        ...(compare && prev.length
          ? [
              {
                label: "Prior period",
                data: prev.map((d) => d.revenue),
                borderColor: "rgba(107, 58, 42, 0.25)",
                borderDash: [4, 4],
                fill: false,
                tension: 0.3,
              },
            ]
          : []),
      ],
    };
  }, [cur, summary, compare]);

  const paymentChart = useMemo(() => {
    const mix = cur?.paymentMix || {};
    return {
      labels: ["COD", "Razorpay", "Partial"],
      datasets: [
        {
          data: [mix.COD || 0, mix.Razorpay || 0, mix.Partial || 0],
          backgroundColor: ["#E8DED2", "#6B3A2A", "#C4A574"],
        },
      ],
    };
  }, [cur]);

  const categoryChart = useMemo(() => {
    const cats = cur?.categoryRevenue?.slice(0, 6) || [];
    return {
      labels: cats.map((c) => c.department),
      datasets: [
        {
          label: "Revenue",
          data: cats.map((c) => c.revenue),
          backgroundColor: "#6B3A2A",
        },
      ],
    };
  }, [cur]);

  const exportFile = async (kind) => {
    try {
      const q = `from=${from}&to=${to}`;
      await downloadAnalyticsCsv(
        `${backendUrl}/api/analytics/export/${kind}?${q}`,
        token,
        `${kind}-${from}-${to}.csv`
      );
    } catch {
      toast.error("Export failed");
    }
  };

  if (!analyticsOn) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-gray-600 mb-2">Analytics Pro is not enabled for this deployment.</p>
        <p className="text-sm text-gray-400">Set FEATURE_ANALYTICS_PRO=true in backend .env</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <PageHeader
        title="Analytics Pro"
        subtitle="Revenue, products, coupons, and exports for any date range."
      />

      <div className="flex flex-wrap gap-2 items-end bg-white border border-tz-pink-soft rounded-2xl p-4">
        <div className="flex flex-wrap gap-1.5">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                preset === p.id ? "bg-tz-navy text-white" : "bg-tz-cream text-tz-navy"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center ml-auto">
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset("custom"); }} className="border rounded-lg px-2 py-1.5 text-sm" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset("custom"); }} className="border rounded-lg px-2 py-1.5 text-sm" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
            Compare
          </label>
          <button type="button" onClick={load} className="text-xs font-semibold underline">
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Gross revenue" value={formatInr(cur?.grossRevenue)} delta={pctBadge(deltas?.grossRevenue)} loading={loading} />
        <KpiCard label="Net revenue" value={formatInr(cur?.netRevenue)} delta={pctBadge(deltas?.netRevenue)} loading={loading} />
        <KpiCard label="Orders" value={cur?.orderCount ?? "—"} delta={pctBadge(deltas?.orderCount)} loading={loading} />
        <KpiCard label="AOV" value={formatInr(cur?.aov)} delta={pctBadge(deltas?.aov)} loading={loading} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-tz-pink-soft p-4">
          <h3 className="font-semibold text-tz-navy mb-3 text-sm">Daily revenue</h3>
          {loading ? (
            <div className="h-48 bg-tz-navy/5 rounded animate-pulse" />
          ) : cur?.dailyRevenue?.length ? (
            <Line data={revenueChart} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
          ) : (
            <p className="text-sm text-gray-500 py-12 text-center">No orders in this period</p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-tz-pink-soft p-4">
          <h3 className="font-semibold text-tz-navy mb-3 text-sm">Payment mix</h3>
          {loading ? (
            <div className="h-48 bg-tz-navy/5 rounded animate-pulse" />
          ) : (
            <Doughnut data={paymentChart} options={{ plugins: { legend: { position: "bottom" } } }} />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-tz-pink-soft p-4">
          <h3 className="font-semibold text-tz-navy mb-3 text-sm">Top categories</h3>
          {categoryChart.labels.length ? (
            <Bar data={categoryChart} options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
          ) : (
            <p className="text-sm text-gray-500">No category data</p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-tz-pink-soft p-4 space-y-3">
          <h3 className="font-semibold text-tz-navy text-sm">Customer mix</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-tz-cream/80 p-3">
              <p className="text-xs text-gray-500">New customers</p>
              <p className="text-xl font-bold">{cur?.newCustomers ?? 0}</p>
            </div>
            <div className="rounded-xl bg-tz-cream/80 p-3">
              <p className="text-xs text-gray-500">Repeat customers</p>
              <p className="text-xl font-bold">{cur?.repeatCustomers ?? 0}</p>
            </div>
            <div className="rounded-xl bg-tz-cream/80 p-3">
              <p className="text-xs text-gray-500">Return / RTO rate</p>
              <p className="text-xl font-bold">{cur?.returnRate ?? 0}%</p>
            </div>
            <div className="rounded-xl bg-tz-cream/80 p-3">
              <p className="text-xs text-gray-500">Coupon orders</p>
              <p className="text-xl font-bold">{cur?.couponOrders ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-tz-pink-soft p-4 overflow-x-auto">
          <h3 className="font-semibold text-tz-navy mb-3 text-sm">Top products</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="py-2">Product</th>
                <th className="py-2">Units</th>
                <th className="py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={String(p.productId)} className="border-b border-gray-50">
                  <td className="py-2 pr-2">
                    <p className="font-medium truncate max-w-[180px]">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.department}</p>
                  </td>
                  <td className="py-2">{p.units}</td>
                  <td className="py-2 text-right font-semibold">{formatInr(p.revenue)}</td>
                </tr>
              ))}
              {!products.length && !loading && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-500">
                    No product sales in range
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-2xl border border-tz-pink-soft p-4 overflow-x-auto">
          <h3 className="font-semibold text-tz-navy mb-3 text-sm">Coupon performance</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="py-2">Code</th>
                <th className="py-2">Orders</th>
                <th className="py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id} className="border-b border-gray-50">
                  <td className="py-2 font-mono text-xs">{c._id}</td>
                  <td className="py-2">{c.orders}</td>
                  <td className="py-2 text-right font-semibold">{formatInr(c.revenue)}</td>
                </tr>
              ))}
              {!coupons.length && !loading && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-500">
                    No coupon usage in range
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-tz-pink-soft p-5 space-y-4">
        <div>
          <h3 className="text-base font-display font-semibold text-tz-navy">Daily email digest</h3>
          <p className="text-sm text-tz-navy/60 mt-1">
            Yesterday&apos;s KPIs emailed at 8:00 AM IST when enabled. Uses your mail provider (Resend/SMTP).
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-tz-navy cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(digest.enabled)}
            onChange={(e) => setDigest((d) => ({ ...d, enabled: e.target.checked }))}
            className="rounded border-tz-pink-soft"
          />
          Send daily digest
        </label>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-tz-navy/50 mb-1">Recipient email</label>
            <input
              type="email"
              value={digest.email || ""}
              onChange={(e) => setDigest((d) => ({ ...d, email: e.target.value }))}
              placeholder="Defaults to ADMIN_EMAIL"
              className="w-full px-3 py-2 border rounded-xl text-sm"
            />
          </div>
          <button
            type="button"
            onClick={saveDigest}
            disabled={digestSaving}
            className="px-4 py-2 rounded-xl bg-tz-navy text-white text-sm font-semibold disabled:opacity-50"
          >
            {digestSaving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={sendDigestNow}
            disabled={digestSending}
            className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-50"
          >
            {digestSending ? "Sending…" : "Send test now"}
          </button>
        </div>
        {digest.lastSentAt && (
          <p className="text-xs text-tz-navy/50">
            Last sent: {new Date(digest.lastSentAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-tz-pink-soft p-4 flex flex-wrap gap-2">
        <p className="w-full text-sm font-semibold text-tz-navy mb-1">Exports</p>
        <button type="button" onClick={() => exportFile("orders")} className="px-4 py-2 rounded-xl bg-tz-navy text-white text-xs font-semibold">
          Orders CSV (line items)
        </button>
        <button type="button" onClick={() => exportFile("products")} className="px-4 py-2 rounded-xl border text-xs font-semibold">
          Products CSV
        </button>
        <button type="button" onClick={() => exportFile("customers")} className="px-4 py-2 rounded-xl border text-xs font-semibold">
          Customers CSV
        </button>
        {invoicingOn && (
          <a
            href={`${backendUrl}/api/invoice/export/accounting?from=${from}&to=${to}`}
            onClick={(e) => {
              e.preventDefault();
              downloadAnalyticsCsv(
                `${backendUrl}/api/invoice/export/accounting?from=${from}&to=${to}`,
                token,
                `accounting-${from}-${to}.csv`
              ).catch(() => toast.error("Accounting export failed — is invoicing enabled?"));
            }}
            className="px-4 py-2 rounded-xl border text-xs font-semibold text-[#4c8c7b] border-[#89c9b8] inline-flex items-center"
          >
            Accounting CSV
          </a>
        )}
      </div>
    </div>
  );
};

export default Analytics;
