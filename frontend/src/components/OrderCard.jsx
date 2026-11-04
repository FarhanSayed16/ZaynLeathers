import StatusBadge from "./StatusBadge";
import OrderTracker from "./OrderTracker";
import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { canCustomerCancel, resolveItemStatus } from "../utils/orderStatus";

const OrderCard = ({ order, onCancel, navigate }) => {
  const { formatPrice } = useContext(ShopContext);
  const leadStatus = resolveItemStatus(order, order.items?.[0]);

  return (
    <div className="bg-white rounded-xl shadow p-5 mb-6">
      <div className="flex justify-between text-sm text-gray-500 mb-4">
        <span>Order #{order.orderNumber || order._id}</span>
        <span>{new Date(order.date).toLocaleDateString("en-IN")}</span>
      </div>

      {(order.items || []).map((item) => {
        const itemStatus = resolveItemStatus(order, item);
        const photo = Array.isArray(item.image) ? item.image[0] : item.image;
        return (
          <div key={`${item._id}-${item.size || ""}`} className="flex gap-4 mb-4">
            <img
              src={photo || "/brand/product-placeholder.jpg"}
              alt=""
              className="w-20 h-20 rounded object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm">
                Size: {item.size || "—"} | Qty: {item.quantity}
              </p>
              <p className="font-bold">{formatPrice(item.price)}</p>

              <div className="flex gap-3 mt-2 items-center">
                <StatusBadge status={itemStatus} />

                {canCustomerCancel(itemStatus) && (
                  <button
                    type="button"
                    onClick={() => onCancel(order._id, item._id, item.size)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <OrderTracker status={leadStatus} />

      <button
        type="button"
        onClick={() => navigate(`/orders/${order._id}`)}
        className="mt-4 text-sm text-blue-600 hover:underline"
      >
        View Details →
      </button>
    </div>
  );
};

export default OrderCard;
