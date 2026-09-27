import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { authHeaders, formatAddressLine } from "../utils/india";
import { shortOrderId, statusLabel, TRACKING_STAGES } from "../utils/orderStatus";
import {
  customerInvoiceState,
  orderItemsSubtotal,
  paymentMethodLabel,
} from "../utils/orderReceipt";
import * as shopApi from "../api/shopApi";
import { isWooMode } from "../api/mode";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, backendUrl, formatPrice, addToCart, settings } = useContext(ShopContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [returnBusy, setReturnBusy] = useState(false);

  const load = async () => {
    if (!token) return;
    try {
      const res = await shopApi.getOrder(id, token);
      if (res.success) setOrder(res.order);
      else toast.error(res.message || "Order not found");
    } catch {
      toast.error("Could not load this order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    load();
  }, [token, id]);

  const confirmCancel = async () => {
    if (isWooMode) {
      toast.info("Please contact support to cancel items — manage returns in WooCommerce later");
      setShowModal(false);
      setSelectedItem(null);
      return;
    }
    try {
      const res = await axios.post(
        `${backendUrl}/api/order/cancel`,
        selectedItem,
        { headers: authHeaders(token) }
      );
      if (res.data.success) {
        toast.success("Item cancelled");
        load();
      } else toast.error(res.data.message);
    } catch {
      toast.error("Cancel failed");
    } finally {
      setShowModal(false);
      setSelectedItem(null);
    }
  };

  const requestReturn = async () => {
    if (isWooMode) {
      toast.info("Returns will be handled via WooCommerce / shipping partner");
      return;
    }
    const reason = window.prompt("Why are you returning this order? (optional)") || "";
    setReturnBusy(true);
    try {
      const res = await axios.post(
        `${backendUrl}/api/shipping/shiprocket/return/request/${order._id}`,
        { reason },
        { headers: authHeaders(token) }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Return requested");
        load();
      } else toast.error(res.data.message || "Return request failed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Return request failed");
    } finally {
      setReturnBusy(false);
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(String(order._id));
    toast.success("Order ID copied");
  };

  const downloadInvoice = async () => {
    if (isWooMode) {
      toast.info("Invoices are managed in WooCommerce for this store");
      return;
    }
    try {
      const res = await axios.get(`${backendUrl}/api/invoice/my/${order._id}/pdf`, {
        headers: authHeaders(token),
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      window.open(url, "_blank");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invoice not available yet");
    }
  };

  const downloadCreditNote = async (cnNumber) => {
    if (isWooMode) {
      toast.info("Credit notes are managed in WooCommerce for this store");
      return;
    }
    try {
      const res = await axios.get(
        `${backendUrl}/api/invoice/my/${order._id}/credit-note/${encodeURIComponent(cnNumber)}/pdf`,
        { headers: authHeaders(token), responseType: "blob" }
      );
      const url = URL.createObjectURL(res.data);
      window.open(url, "_blank");
    } catch {
      toast.error("Could not download credit note");
    }
  };

  if (!token) return null;
  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-tz-pink border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-tz-navy/60 mb-4">We could not find that order.</p>
        <Link to="/orders" className="text-sm font-semibold underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const addr = order.address || {};
  const pd = order.paymentDetails || {};
  const hasDelivered = (order.items || []).some((i) => i.status === "Delivered");
  const canReturn =
    hasDelivered &&
    !order.shipping?.return?.requested &&
    !(order.items || []).some((i) =>
      ["ReturnRequested", "ReturnInTransit", "Returned"].includes(i.status)
    );

  const whatsappOn = settings?.features?.whatsapp === true;
  const invoiceState = customerInvoiceState(order, settings);
  const itemsSub = orderItemsSubtotal(order);
  const grandTotal = Number(order.amount) || itemsSub;
  const adjustment = Math.round((grandTotal - itemsSub) * 100) / 100;
  const creditNotes = order.creditNotes || [];

  const shareInvoiceWhatsApp = () => {
    if (!order.invoice?.pdfUrl) return;
    const text = encodeURIComponent(
      `My invoice ${order.invoice.number} for order #${shortOrderId(order._id)}:\n${order.invoice.pdfUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/orders" className="text-sm text-tz-navy/60 hover:text-tz-navy">
        ← All orders
      </Link>
      <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-3">
        <Title text1="ORDER" text2={`#${shortOrderId(order._id)}`} />
        <button type="button" onClick={copyId} className="text-xs font-semibold underline">
          Copy full ID
        </button>
      </div>

      <p className="text-sm text-tz-navy/55 mb-6">
        Placed {new Date(order.date || order.createdAt).toLocaleString("en-IN")}
      </p>

      {/* Payment & receipt summary */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 space-y-3">
        <h3 className="font-semibold text-sm text-tz-navy">Payment summary</h3>
        <dl className="text-sm space-y-1.5">
          <div className="flex justify-between gap-4">
            <dt className="text-tz-navy/60">Items subtotal</dt>
            <dd>{formatPrice(itemsSub)}</dd>
          </div>
          {adjustment !== 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-tz-navy/60">Delivery / discount</dt>
              <dd>
                {adjustment > 0 ? "+" : ""}
                {formatPrice(adjustment)}
              </dd>
            </div>
          )}
          {order.couponCode && (
            <div className="flex justify-between gap-4">
              <dt className="text-tz-navy/60">Coupon</dt>
              <dd className="font-medium">{order.couponCode}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 pt-2 border-t font-semibold">
            <dt>Order total</dt>
            <dd>{formatPrice(grandTotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tz-navy/60">Payment method</dt>
            <dd>{paymentMethodLabel(order.paymentMethod)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tz-navy/60">Payment status</dt>
            <dd>{order.payment ? "Paid in full" : "Payment pending"}</dd>
          </div>
          {order.paymentMethod === "Partial" && pd.advanceAmount != null && (
            <>
              <div className="flex justify-between gap-4 text-emerald-800">
                <dt>Advance paid</dt>
                <dd>{formatPrice(pd.advanceAmount)}</dd>
              </div>
              {pd.balanceAmount != null && pd.balanceAmount > 0 && (
                <div className="flex justify-between gap-4 text-amber-800">
                  <dt>{pd.balancePaid ? "Balance paid" : "Balance due on delivery"}</dt>
                  <dd>{formatPrice(pd.balanceAmount)}</dd>
                </div>
              )}
            </>
          )}
          {order.billing?.gstin && (
            <div className="flex justify-between gap-4">
              <dt className="text-tz-navy/60">Billing GSTIN</dt>
              <dd className="text-xs font-mono">{order.billing.gstin}</dd>
            </div>
          )}
          {order.billing?.companyName && (
            <div className="flex justify-between gap-4">
              <dt className="text-tz-navy/60">Company</dt>
              <dd>{order.billing.companyName}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Invoice / receipt */}
      {invoiceState.kind !== "off" && (
        <section className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-start justify-between">
            <div className="flex-1 min-w-[140px]">
              <p className="font-semibold text-sm text-tz-navy">Invoice & receipt</p>
              {invoiceState.kind === "ready" && (
                <p className="text-xs text-tz-navy/50 mt-0.5">
                  {invoiceState.label} · {invoiceState.number}
                </p>
              )}
              {invoiceState.kind !== "ready" && (
                <p className="text-xs text-tz-navy/55 mt-1">{invoiceState.message}</p>
              )}
              {order.invoice?.issuedAt && (
                <p className="text-[11px] text-tz-navy/40 mt-1">
                  Issued {new Date(order.invoice.issuedAt).toLocaleDateString("en-IN")}
                </p>
              )}
            </div>
            {invoiceState.kind === "ready" && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadInvoice}
                  className="text-sm font-semibold px-4 py-2 rounded-xl bg-tz-navy text-white"
                >
                  Download PDF
                </button>
                {whatsappOn && order.invoice?.pdfUrl && (
                  <button
                    type="button"
                    onClick={shareInvoiceWhatsApp}
                    className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#25D366] text-white"
                  >
                    Share
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {creditNotes.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
          <h3 className="font-semibold text-sm text-tz-navy mb-2">Credit notes</h3>
          <ul className="space-y-2">
            {creditNotes.map((cn) => (
              <li
                key={cn.number}
                className="flex flex-wrap items-center justify-between gap-2 text-sm border border-gray-100 rounded-xl px-3 py-2"
              >
                <div>
                  <p className="font-medium">{cn.number}</p>
                  <p className="text-xs text-tz-navy/50">
                    {cn.issuedAt ? new Date(cn.issuedAt).toLocaleDateString("en-IN") : ""}
                    {cn.reason ? ` · ${cn.reason}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadCreditNote(cn.number)}
                  className="text-xs font-semibold underline"
                >
                  Download
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
        <h3 className="font-semibold text-sm mb-2">Delivery address</h3>
        <p className="text-sm">
          {addr.firstName} {addr.lastName}
        </p>
        <p className="text-sm text-tz-navy/70">{formatAddressLine(addr)}</p>
        <p className="text-sm text-tz-navy/70">{addr.phone}</p>
      </section>

      {order.shipping?.trackingUrl && (
        <a
          href={order.shipping.trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-4 text-sm font-semibold text-tz-navy underline"
        >
          Track shipment
          {order.shipping.awbCode ? ` · ${order.shipping.awbCode}` : ""}
        </a>
      )}

      <div className="space-y-4">
        {(order.items || []).map((item) => {
          const currentIndex = TRACKING_STAGES.includes(item.status)
            ? TRACKING_STAGES.indexOf(item.status)
            : -1;
          return (
            <div key={item._id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex gap-4">
                <img
                  src={item?.image?.[0] || "/brand/product-placeholder.jpg"}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-tz-navy/60">
                    {formatPrice(item.price)} · Qty {item.quantity}
                    {item.size ? ` · Size ${item.size}` : ""}
                    {item.color ? ` · ${item.color}` : ""}
                    {item.sku ? ` · SKU ${item.sku}` : ""}
                  </p>
                  <p className="text-sm mt-1">{statusLabel(item.status)}</p>
                  {item.status !== "Cancelled" && item.productId && (
                    <button
                      type="button"
                      onClick={() => addToCart(item.productId, item.size)}
                      className="mt-2 text-xs font-semibold underline"
                    >
                      Buy again
                    </button>
                  )}
                </div>
                {item.status !== "Delivered" && item.status !== "Cancelled" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem({ orderId: order._id, itemId: item._id, size: item.size });
                      setShowModal(true);
                    }}
                    className="text-xs text-red-600 border border-red-600 px-3 py-1 rounded h-fit"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <div className="flex items-center mt-4">
                {TRACKING_STAGES.map((stage, i) => {
                  const done = i <= currentIndex && item.status !== "Cancelled";
                  return (
                    <div key={stage} className="flex items-center flex-1">
                      <div
                        className={`w-3 h-3 rounded-full border ${
                          item.status === "Cancelled"
                            ? "bg-red-500 border-red-500"
                            : done
                              ? "bg-green-600 border-green-600"
                              : "bg-white border-gray-300"
                        }`}
                      />
                      {i < TRACKING_STAGES.length - 1 && (
                        <div className={`flex-1 h-0.5 ${done ? "bg-green-600" : "bg-gray-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-tz-navy/45 mt-1">
                {TRACKING_STAGES.map((stage) => (
                  <span key={stage} className="w-[20%] text-center">
                    {statusLabel(stage)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {canReturn && (
        <button
          type="button"
          onClick={requestReturn}
          disabled={returnBusy}
          className="mt-6 text-sm border border-tz-navy px-4 py-2 rounded-xl"
        >
          {returnBusy ? "Requesting…" : "Request return"}
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-[90%] max-w-md text-center">
            <h2 className="text-lg font-semibold mb-3">Cancel this item?</h2>
            <div className="flex justify-center gap-4">
              <button onClick={confirmCancel} className="bg-red-600 text-white px-5 py-2 rounded">
                Yes, cancel
              </button>
              <button onClick={() => setShowModal(false)} className="bg-gray-200 px-5 py-2 rounded">
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
