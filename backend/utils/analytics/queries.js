import orderModel from "../../models/orderModel.js";
import userModel from "../../models/userModel.js";
import {
  activeOrderMatch,
  orderInRangeMatch,
  parseRangeQuery,
  pctChange,
} from "./dateRange.js";

const RETURN_STATUSES = ["ReturnRequested", "ReturnInTransit", "Returned", "RTO"];

function baseMatch(fromMs, toMs) {
  return {
    $and: [orderInRangeMatch(fromMs, toMs), activeOrderMatch()],
  };
}

async function creditNoteTotal(fromMs, toMs) {
  const rows = await orderModel.aggregate([
    { $match: orderInRangeMatch(fromMs, toMs) },
    { $unwind: { path: "$creditNotes", preserveNullAndEmptyArrays: false } },
    {
      $match: {
        "creditNotes.issuedAt": {
          $gte: new Date(fromMs),
          $lte: new Date(toMs),
        },
      },
    },
    { $group: { _id: null, total: { $sum: "$creditNotes.amount" } } },
  ]);
  return rows[0]?.total || 0;
}

async function kpiBlock(fromMs, toMs) {
  const match = baseMatch(fromMs, toMs);

  const [orderAgg] = await orderModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        grossRevenue: { $sum: "$amount" },
        orderCount: { $sum: 1 },
        cod: { $sum: { $cond: [{ $eq: ["$paymentMethod", "COD"] }, 1, 0] } },
        razorpay: { $sum: { $cond: [{ $eq: ["$paymentMethod", "Razorpay"] }, 1, 0] } },
        partial: { $sum: { $cond: [{ $eq: ["$paymentMethod", "Partial"] }, 1, 0] } },
        couponOrders: {
          $sum: {
            $cond: [{ $and: [{ $ne: ["$couponCode", ""] }, { $ne: ["$couponCode", null] }] }, 1, 0],
          },
        },
      },
    },
  ]);

  const grossRevenue = orderAgg?.grossRevenue || 0;
  const orderCount = orderAgg?.orderCount || 0;
  const credits = await creditNoteTotal(fromMs, toMs);
  const netRevenue = Math.max(0, grossRevenue - credits);
  const aov = orderCount ? Math.round(grossRevenue / orderCount) : 0;

  const statusRows = await orderModel.aggregate([
    { $match: match },
    { $unwind: "$items" },
    { $group: { _id: "$items.status", count: { $sum: "$items.quantity" } } },
  ]);

  const statusFunnel = {};
  statusRows.forEach((r) => {
    statusFunnel[r._id] = r.count;
  });

  const deliveredUnits = statusFunnel.Delivered || 0;
  const returnUnits = RETURN_STATUSES.reduce((s, st) => s + (statusFunnel[st] || 0), 0);
  const returnRate =
    deliveredUnits + returnUnits > 0
      ? Math.round((returnUnits / (deliveredUnits + returnUnits)) * 1000) / 10
      : 0;

  const categoryRows = await orderModel.aggregate([
    { $match: match },
    { $unwind: "$items" },
    { $match: { "items.status": { $ne: "Cancelled" } } },
    {
      $group: {
        _id: { $ifNull: ["$items.department", "$items.category"] },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        units: { $sum: "$items.quantity" },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  const dailyRows = await orderModel.aggregate([
    { $match: match },
    {
      $addFields: {
        orderAt: {
          $cond: [
            { $gt: ["$date", 0] },
            { $toDate: "$date" },
            "$createdAt",
          ],
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderAt" } },
        revenue: { $sum: "$amount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const userIds = await orderModel.distinct("userId", {
    ...match,
    userId: { $ne: null },
  });

  let newCustomers = 0;
  let repeatCustomers = 0;

  if (userIds.length) {
    const priorUserIds = await orderModel.distinct("userId", {
      userId: { $in: userIds },
      date: { $lt: fromMs },
    });
    const priorSet = new Set(priorUserIds.map(String));
    userIds.forEach((uid) => {
      if (priorSet.has(String(uid))) repeatCustomers += 1;
      else newCustomers += 1;
    });
  }

  return {
    grossRevenue,
    netRevenue,
    creditNotesTotal: credits,
    orderCount,
    aov,
    paymentMix: {
      COD: orderAgg?.cod || 0,
      Razorpay: orderAgg?.razorpay || 0,
      Partial: orderAgg?.partial || 0,
    },
    statusFunnel,
    returnRate,
    couponOrders: orderAgg?.couponOrders || 0,
    newCustomers,
    repeatCustomers,
    categoryRevenue: categoryRows.map((r) => ({
      department: r._id || "other",
      revenue: r.revenue,
      units: r.units,
    })),
    dailyRevenue: dailyRows.map((r) => ({
      date: r._id,
      revenue: r.revenue,
      orders: r.orders,
    })),
  };
}

export async function buildAnalyticsSummary({ from, to, compareFrom, compareTo }) {
  const range = parseRangeQuery(from, to);
  const current = await kpiBlock(range.fromMs, range.toMs);

  let compare = null;
  let previous = null;
  let deltas = null;

  if (compareFrom && compareTo) {
    compare = parseRangeQuery(compareFrom, compareTo);
    previous = await kpiBlock(compare.fromMs, compare.toMs);
    deltas = {
      grossRevenue: pctChange(current.grossRevenue, previous.grossRevenue),
      netRevenue: pctChange(current.netRevenue, previous.netRevenue),
      orderCount: pctChange(current.orderCount, previous.orderCount),
      aov: pctChange(current.aov, previous.aov),
    };
  }

  return { range, compare, current, previous, deltas };
}

export async function topProducts({ from, to, limit = 10, sort = "revenue" }) {
  const { fromMs, toMs } = parseRangeQuery(from, to);
  const sortField = sort === "units" ? "units" : "revenue";

  const rows = await orderModel.aggregate([
    { $match: baseMatch(fromMs, toMs) },
    { $unwind: "$items" },
    { $match: { "items.status": { $ne: "Cancelled" } } },
    {
      $group: {
        _id: "$items.productId",
        name: { $first: "$items.name" },
        sku: { $first: "$items.sku" },
        department: { $first: { $ifNull: ["$items.department", "$items.category"] } },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        units: { $sum: "$items.quantity" },
        orders: { $addToSet: "$_id" },
      },
    },
    {
      $project: {
        productId: "$_id",
        name: 1,
        sku: 1,
        department: 1,
        revenue: 1,
        units: 1,
        orderCount: { $size: "$orders" },
      },
    },
    { $sort: { [sortField]: -1 } },
    { $limit: Math.min(Number(limit) || 10, 50) },
  ]);

  return rows;
}

export async function couponPerformance({ from, to }) {
  const { fromMs, toMs } = parseRangeQuery(from, to);

  return orderModel.aggregate([
    {
      $match: {
        ...baseMatch(fromMs, toMs),
        couponCode: { $exists: true, $nin: ["", null] },
      },
    },
    {
      $group: {
        _id: "$couponCode",
        orders: { $sum: 1 },
        revenue: { $sum: "$amount" },
      },
    },
    { $sort: { orders: -1 } },
  ]);
}

export async function exportOrdersRows({ from, to, maxRows = 10000 }) {
  const { fromMs, toMs } = parseRangeQuery(from, to);
  const orders = await orderModel
    .find(baseMatch(fromMs, toMs))
    .sort({ date: -1 })
    .limit(maxRows + 1)
    .lean();

  const truncated = orders.length > maxRows;
  const slice = truncated ? orders.slice(0, maxRows) : orders;

  const rows = [];
  slice.forEach((o) => {
    (o.items || []).forEach((item) => {
      const a = o.address || {};
      rows.push({
        orderId: o._id,
        orderDate: new Date(o.date || o.createdAt).toISOString(),
        customer: `${a.firstName || ""} ${a.lastName || ""}`.trim(),
        phone: a.phone || o.guestPhone,
        email: a.email || o.guestEmail,
        city: a.city,
        state: a.state,
        productId: item.productId,
        productName: item.name,
        sku: item.sku,
        color: item.color,
        size: item.size,
        department: item.department || item.category,
        quantity: item.quantity,
        unitPrice: item.price,
        lineTotal: item.price * item.quantity,
        itemStatus: item.status,
        orderTotal: o.amount,
        paymentMethod: o.paymentMethod,
        paid: o.payment ? "yes" : "no",
        couponCode: o.couponCode || "",
        invoiceNumber: o.invoice?.number || "",
      });
    });
  });

  return { rows, truncated, maxRows };
}

export async function exportProductRows({ from, to }) {
  return topProducts({ from, to, limit: 500, sort: "revenue" });
}

export async function exportCustomerRows({ from, to }) {
  const { fromMs, toMs } = parseRangeQuery(from, to);
  const rows = await orderModel.aggregate([
    { $match: { ...baseMatch(fromMs, toMs), userId: { $ne: null } } },
    {
      $group: {
        _id: "$userId",
        orders: { $sum: 1 },
        revenue: { $sum: "$amount" },
        lastOrderAt: { $max: "$date" },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10000 },
  ]);

  const users = await userModel
    .find({ _id: { $in: rows.map((r) => r._id) } })
    .select("firstName lastName email phone")
    .lean();

  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

  return rows.map((r) => {
    const u = userMap[String(r._id)] || {};
    return {
      userId: r._id,
      name: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
      email: u.email,
      phone: u.phone,
      orders: r.orders,
      revenue: r.revenue,
      lastOrderAt: r.lastOrderAt ? new Date(r.lastOrderAt).toISOString() : "",
    };
  });
}
