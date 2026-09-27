const StatusBadge = ({ status }) => {
  const styles = {
    Delivered: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
    Shipped: "bg-blue-100 text-blue-700",
    OutForDelivery: "bg-orange-100 text-orange-700",
    OrderPlaced: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
};

export default StatusBadge;