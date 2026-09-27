export function adminHeaders(token) {
  return {
    token: token || localStorage.getItem("token") || "",
    Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
  };
}

export function isAdminAuthFailure(payload, status) {
  if (status === 401) return true;
  const msg = String(payload?.message || "").toLowerCase();
  return (
    msg.includes("not authorized") ||
    msg.includes("login again") ||
    msg.includes("expired token") ||
    msg.includes("invalid token") ||
    msg.includes("invalid or expired")
  );
}

export function formatAdminAddress(addr = {}) {
  return [
    [addr.firstName, addr.lastName].filter(Boolean).join(" "),
    addr.phone,
    addr.email,
    addr.street,
    addr.apartment,
    [addr.city, addr.state, addr.zipcode].filter(Boolean).join(", "),
    addr.country,
  ]
    .filter(Boolean)
    .join("\n");
}

export function orderMatchesQuery(order, raw) {
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

export function downloadOrdersCsv(orders = []) {
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = [
    "orderId",
    "date",
    "customer",
    "phone",
    "email",
    "city",
    "pincode",
    "amount",
    "paymentMethod",
    "paid",
    "itemStatus",
  ];
  const lines = [header.join(",")];
  orders.forEach((o) => {
    const a = o.address || {};
    lines.push(
      [
        o._id,
        new Date(o.date || o.createdAt).toISOString(),
        `${a.firstName || ""} ${a.lastName || ""}`.trim(),
        a.phone || o.guestPhone,
        a.email || o.guestEmail,
        a.city,
        a.zipcode,
        o.amount,
        o.paymentMethod,
        o.payment ? "yes" : "no",
        (o.items || []).map((i) => `${i.name}:${i.status}`).join("; "),
      ]
        .map(escape)
        .join(",")
    );
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zayn-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

