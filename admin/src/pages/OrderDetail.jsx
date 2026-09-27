import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";
import ConfirmModal from "../components/ConfirmModal";
import WhatsAppCompose from "../components/WhatsAppCompose";
import OrderInvoicePanel from "../components/OrderInvoicePanel";
import { adminHeaders, formatAdminAddress } from "../utils/adminApi";

const formatItemMeta = (item) =>
  [
    item.color ? `Colour: ${item.color}` : "",
    item.size ? `Size: ${item.size}` : "",
    item.sku ? `SKU: ${item.sku}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

const STATUSES = [
  "OrderPlaced",
  "Packing",
  "Shipped",
  "OutForDelivery",
  "Delivered",
  "Cancelled",
  "RTO",
  "ReturnRequested",
  "ReturnInTransit",
  "Returned",
];

const OrderDetail = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null);

  const load = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/order/admin/${id}`, {
        headers: adminHeaders(token),
      });
      if (res.data.success) setOrder(res.data.order);
      else toast.error(res.data.message || "Order not found");
    } catch {
      toast.error("Could not load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, token]);

  const copyAddress = () => {
    navigator.clipboard.writeText(formatAdminAddress(order.address));
    toast.success("Address copied");
  };

  const copyId = () => {
    navigator.clipboard.writeText(String(order._id));
    toast.success("Order ID copied");
  };

  const applyStatus = async () => {
    if (!pending) return;
    try {
      const res = await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId: order._id, itemId: pending.itemId, status: pending.status },
        { headers: adminHeaders(token) }
      );
      if (res.data.success) {
        toast.success("Status updated");
        await load();
      } else toast.error(res.data.message);
    } catch {
      toast.error("Status update failed");
    } finally {
      setPending(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-2 border-tz-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Order not found.</p>
        <Link to="/orders" className="text-sm font-semibold underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const addr = order.address || {};
  const phone = String(addr.phone || order.guestPhone || "").replace(/\D/g, "");

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link to="/orders" className="text-sm text-tz-navy/60 hover:text-tz-navy no-print">
        ← All orders
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3 no-print">
        <div>
          <h1 className="text-2xl font-display font-semibold text-tz-navy">
            Order #{String(order._id).slice(-8)}
          </h1>
          <p className="text-sm text-gray-500">
            {new Date(order.date || order.createdAt).toLocaleString("en-IN")}
            {" · "}
            {order.paymentMethod}
            {order.payment ? " · paid" : " · payment pending"}
            {order.isGuest && " · guest checkout"}
          </p>
          {order.userId ? (
            <Link to={`/users/${order.userId}`} className="text-xs underline font-semibold">
              Open customer
            </Link>
          ) : order.isGuest ? (
            <p className="text-xs text-amber-700 font-semibold">
              Guest · {order.guestEmail || addr.email}
            </p>
          ) : null}
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => window.print()} className="text-xs font-semibold underline">
            Print packing slip
          </button>
          <button type="button" onClick={copyId} className="text-xs font-semibold underline">
            Copy full ID
          </button>
        </div>
      </div>

      <section className="hidden print:block print-slip bg-white p-0">
        <h1 className="text-xl font-bold">Zayn Leathers packing slip</h1>
        <p className="text-sm mt-1">Order {String(order._id)}</p>
        <p className="text-sm">{new Date(order.date || order.createdAt).toLocaleString("en-IN")}</p>
        <div className="mt-4 text-sm whitespace-pre-line">{formatAdminAddress(addr)}</div>
        <table className="w-full text-sm mt-4 border-t">
          <thead>
            <tr>
              <th className="text-left py-1">Item</th>
              <th className="text-left">Colour / size / SKU</th>
              <th className="text-left">Qty</th>
              <th className="text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item) => (
              <tr key={item._id} className="border-t">
                <td className="py-1">{item.name}</td>
                <td className="text-xs">{formatItemMeta(item) || "—"}</td>
                <td>{item.quantity}</td>
                <td className="text-right">₹{item.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="font-bold mt-4 text-right">Total ₹{order.amount}</p>
        <p className="text-xs mt-6">{order.paymentMethod}{order.payment ? " · paid" : ""}</p>
      </section>

      <section className="bg-white rounded-2xl border border-tz-pink-soft p-5 no-print">
        <div className="flex justify-between gap-3 mb-2">
          <h2 className="font-semibold text-tz-navy">Shipping address</h2>
          <button type="button" onClick={copyAddress} className="text-xs font-semibold underline">
            Copy address
          </button>
        </div>
        <p className="font-medium">
          {addr.firstName} {addr.lastName}
        </p>
        <p className="text-sm text-gray-600 whitespace-pre-line mt-1">
          {formatAdminAddress(addr)}
        </p>
        <div className="flex flex-wrap gap-3 mt-3 text-sm">
          {phone && (
            <a href={`tel:${phone}`} className="font-semibold text-tz-navy underline">
              Call
            </a>
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-tz-pink-soft p-5 no-print">
        <h2 className="font-semibold text-tz-navy mb-3">Items</h2>
        <div className="space-y-3">
          {(order.items || []).map((item) => (
            <div key={item._id} className="flex gap-3 border-b border-gray-100 pb-3 last:border-0">
              <img
                src={item.image?.[0]}
                alt=""
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-gray-500">
                  ₹{item.price} · Qty {item.quantity}
                  {formatItemMeta(item) ? ` · ${formatItemMeta(item)}` : ""}
                </p>
                <p className="text-xs mt-1">{item.status}</p>
              </div>
              <select
                className="h-fit border rounded-lg text-xs px-2 py-1"
                value={item.status}
                disabled={item.status === "Cancelled" && order.cancelledBy === "USER"}
                onChange={(e) =>
                  setPending({
                    itemId: item._id,
                    status: e.target.value,
                    label: `${item.name} → ${e.target.value}`,
                  })
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p className="font-bold mt-4">Total ₹{order.amount}</p>
      </section>

      <OrderInvoicePanel order={order} token={token} onUpdated={load} />

      <WhatsAppCompose order={order} />

      <p className="text-xs text-gray-500 no-print">
        Courier / Shiprocket actions stay on the{" "}
        <button type="button" className="underline" onClick={() => navigate("/orders")}>
          orders list
        </button>{" "}
        while shipping is enabled.
      </p>

      <ConfirmModal
        open={Boolean(pending)}
        title="Change order status?"
        message={pending ? `Update this item to ${pending.status}?` : ""}
        confirmText="Update"
        confirmClass="bg-tz-navy hover:bg-tz-pink"
        onCancel={() => setPending(null)}
        onConfirm={applyStatus}
      />
    </div>
  );
};

export default OrderDetail;
