const RETURN_SET = ["ReturnRequested", "ReturnInTransit", "Returned", "RTO"];

export function matchesOrderSearch(order, raw) {
  const q = String(raw || "").trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  const addr = order.address || {};
  const phone = String(addr.phone || order.guestPhone || "").replace(/\D/g, "");
  const hay = [
    addr.firstName,
    addr.lastName,
    addr.email,
    addr.city,
    addr.zipcode,
    order.guestEmail,
    order.guestPhone,
    order._id,
    String(order._id).slice(-8),
    order.orderType,
    order.paymentMethod,
    ...(order.items || []).map((i) => i.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (hay.includes(q)) return true;
  if (digits.length >= 4 && phone.includes(digits)) return true;
  return false;
}

export function matchesStatusFilter(order, selectedStatus) {
  if (!selectedStatus || selectedStatus === "All") return true;

  if (selectedStatus === "BalanceDue") {
    return (
      order.paymentMethod === "Partial" &&
      order.paymentDetails?.advancePaid &&
      !order.paymentDetails?.balancePaid &&
      !order.paymentDetails?.advanceRefunded
    );
  }

  if (selectedStatus === "Returns") {
    return (
      (order.items || []).some((item) => RETURN_SET.includes(item.status)) ||
      Boolean(order.shipping?.return?.requested)
    );
  }

  if (selectedStatus === "CancelledToday") {
    const d = new Date(order.date || order.createdAt);
    const t = new Date();
    const today =
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate();
    return today && (order.items || []).some((item) => item.status === "Cancelled");
  }

  return (order.items || []).some((item) => item.status === selectedStatus);
}

export function sortOrders(orders, sortOrder = "newest") {
  return [...orders].sort((a, b) => {
    const da = Number(a.date || a.createdAt || 0);
    const db = Number(b.date || b.createdAt || 0);
    return sortOrder === "newest" ? db - da : da - db;
  });
}

export function computeOrderStats(orders) {
  return {
    total: orders.length,
    pending: orders.filter((order) =>
      (order.items || []).some(
        (item) => item.status !== "Delivered" && item.status !== "Cancelled"
      )
    ).length,
    delivered: orders.filter((order) =>
      (order.items || []).some((item) => item.status === "Delivered")
    ).length,
    cancelled: orders.filter((order) =>
      (order.items || []).some((item) => item.status === "Cancelled")
    ).length,
    paid: orders.filter((order) => order.payment === true).length,
  };
}

export function buildOrderDateQuery(dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return null;
  const range = {};
  if (dateFrom) {
    const from = new Date(dateFrom);
    if (!Number.isNaN(from.getTime())) range.$gte = from.getTime();
  }
  if (dateTo) {
    const to = new Date(dateTo);
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      range.$lte = to.getTime();
    }
  }
  return Object.keys(range).length ? range : null;
}
