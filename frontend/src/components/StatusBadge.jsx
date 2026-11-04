import { normalizeOrderStatus, statusLabel } from "../utils/orderStatus";

const STYLES = {
  Delivered: "bg-emerald-50 text-emerald-800",
  Cancelled: "bg-red-50 text-red-700",
  Shipped: "bg-blue-50 text-blue-800",
  OutForDelivery: "bg-orange-50 text-orange-800",
  Packing: "bg-amber-50 text-amber-900",
  OrderPlaced: "bg-gray-100 text-gray-700",
};

const StatusBadge = ({ status }) => {
  const key = normalizeOrderStatus(status);
  const style = STYLES[key] || "bg-gray-100 text-gray-700";

  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${style}`}>
      {statusLabel(key)}
    </span>
  );
};

export default StatusBadge;
