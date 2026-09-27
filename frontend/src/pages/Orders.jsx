import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import EmptyState from "../components/EmptyState";
import { toast } from "react-toastify";
import { shortOrderId, statusLabel } from "../utils/orderStatus";
import { customerInvoiceState, paymentMethodLabel } from "../utils/orderReceipt";
import * as shopApi from "../api/shopApi";

const Orders = () => {
  const { formatPrice, token, settings } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setLoaded(true);
        return;
      }
      try {
        const res = await shopApi.getUserOrders(token);
        if (res.success) setOrders(res.orders || []);
      } catch {
        toast.error("Failed to load orders");
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, [token]);

  return (
    <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[8vw] pt-10 border-t pb-16">
      <Title text1="MY" text2="ORDERS" />
      <p className="text-sm text-tz-navy/55 mt-2 mb-2 max-w-xl">
        Your full order history is saved to your account — open any order for items, payment details,
        tracking, and invoice / receipt when available.
      </p>

      {!token && loaded && (
        <EmptyState
          title="Sign in to see orders"
          text="Your order history is saved to your account."
          to="/login"
          cta="Sign in"
        />
      )}

      {token && loaded && orders.length === 0 && (
        <EmptyState
          title="No orders yet"
          text="When you place an order it will show up here."
          to="/shop"
          cta="Shop leather"
        />
      )}

      {token &&
        orders.map((order) => {
          const first = order.items?.[0];
          const extra = (order.items?.length || 0) - 1;
          const invoiceState = customerInvoiceState(order, settings);
          const pd = order.paymentDetails || {};

          return (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="mt-4 flex gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-tz-navy/40 transition"
            >
              <img
                src={first?.image?.[0] || "/brand/product-placeholder.jpg"}
                alt=""
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-tz-navy/45">#{shortOrderId(order._id)}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-tz-cream text-tz-navy/70">
                    {paymentMethodLabel(order.paymentMethod)}
                  </span>
                  {order.payment ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                      Paid
                    </span>
                  ) : order.paymentMethod === "Partial" && pd.advancePaid ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900">
                      Partial
                    </span>
                  ) : null}
                  {invoiceState.kind === "ready" && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-900">
                      Invoice ready
                    </span>
                  )}
                </div>
                <p className="font-semibold truncate">
                  {first?.name || "Order"}
                  {extra > 0 ? ` +${extra} more` : ""}
                </p>
                <p className="text-sm text-tz-navy/60">
                  {formatPrice(order.amount)} · {new Date(order.date).toLocaleDateString("en-IN")}
                </p>
                <p className="text-xs mt-1">{statusLabel(first?.status)}</p>
              </div>
            </Link>
          );
        })}
    </div>
  );
};

export default Orders;
