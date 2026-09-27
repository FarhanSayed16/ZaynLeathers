import { parseRangeQuery, orderInRangeMatch } from "../analytics/dateRange.js";
import {
  emailInvoiceToCustomer,
  issueInvoiceForOrder,
  orderHasActiveItems,
  orderIsFullyDelivered,
} from "./issueInvoiceForOrder.js";

const PREVIEW_LIST_CAP = 200;
const DEFAULT_ISSUE_LIMIT = 100;
const MAX_ISSUE_LIMIT = 100;

export function parseBulkInvoiceFilters(input = {}) {
  const from = input.from;
  const to = input.to;
  const range = parseRangeQuery(from, to, 30);

  const dateField = ["order", "delivered", "issued"].includes(input.dateField)
    ? input.dateField
    : "order";

  const deliveredOnly = input.deliveredOnly !== "false" && input.deliveredOnly !== false;
  const missingInvoiceOnly =
    input.missingInvoiceOnly !== "false" && input.missingInvoiceOnly !== false;

  let paymentMethods = input.paymentMethods;
  if (typeof paymentMethods === "string" && paymentMethods.trim()) {
    paymentMethods = paymentMethods.split(",").map((s) => s.trim()).filter(Boolean);
  } else if (!Array.isArray(paymentMethods) || !paymentMethods.length) {
    paymentMethods = null;
  }

  const minAmount = Number(input.minAmount);
  const limit = Math.min(
    MAX_ISSUE_LIMIT,
    Math.max(1, Number(input.limit) || DEFAULT_ISSUE_LIMIT)
  );

  const sendEmail = input.sendEmail !== false && input.sendEmail !== "false";

  return {
    range,
    dateField,
    deliveredOnly,
    missingInvoiceOnly,
    paymentMethods,
    minAmount: Number.isFinite(minAmount) && minAmount > 0 ? minAmount : null,
    limit,
    sendEmail,
    preset: input.preset || "custom",
  };
}

function buildDateFieldQuery(filters) {
  const { fromMs, toMs, fromDate, toDate } = filters.range;

  if (filters.dateField === "delivered") {
    return {
      deliveredAt: { $gte: fromDate, $lte: toDate },
    };
  }

  if (filters.dateField === "issued") {
    return {
      "invoice.issuedAt": { $gte: fromDate, $lte: toDate },
      "invoice.number": { $ne: "" },
    };
  }

  return orderInRangeMatch(fromMs, toMs);
}

function customerLabel(order) {
  const a = order.address || {};
  const name = `${a.firstName || ""} ${a.lastName || ""}`.trim();
  return name || a.phone || order.guestEmail || "—";
}

function classifyOrder(order, filters) {
  const hasInvoice = Boolean(order.invoice?.number);
  const fullyDelivered = orderIsFullyDelivered(order);
  const hasBillable = orderHasActiveItems(order);

  if (!hasBillable) {
    return { eligible: false, reason: "no_billable_items" };
  }

  if (filters.deliveredOnly && !fullyDelivered) {
    return { eligible: false, reason: "not_delivered" };
  }

  if (filters.missingInvoiceOnly && hasInvoice) {
    return { eligible: false, reason: "already_invoiced" };
  }

  if (
    filters.paymentMethods?.length &&
    !filters.paymentMethods.includes(order.paymentMethod)
  ) {
    return { eligible: false, reason: "payment_method" };
  }

  if (filters.minAmount != null && Number(order.amount) < filters.minAmount) {
    return { eligible: false, reason: "min_amount" };
  }

  return { eligible: true, reason: null };
}

function mapOrderRow(order) {
  return {
    orderId: order._id,
    shortId: String(order._id).slice(-8),
    orderDate: order.date ? new Date(order.date).toISOString() : order.createdAt,
    deliveredAt: order.deliveredAt || null,
    invoiceIssuedAt: order.invoice?.issuedAt || null,
    amount: Number(order.amount) || 0,
    paymentMethod: order.paymentMethod,
    customer: customerLabel(order),
    hasInvoice: Boolean(order.invoice?.number),
    invoiceNumber: order.invoice?.number || "",
    fullyDelivered: orderIsFullyDelivered(order),
  };
}

export async function queryOrdersForBulkInvoice(orderModel, filters) {
  const dateQuery = buildDateFieldQuery(filters);
  const orders = await orderModel
    .find(dateQuery)
    .sort(
      filters.dateField === "issued"
        ? { "invoice.issuedAt": -1 }
        : filters.dateField === "delivered"
          ? { deliveredAt: -1 }
          : { date: -1 }
    )
    .lean();

  const summary = {
    matchedInRange: orders.length,
    eligible: 0,
    skippedAlreadyInvoiced: 0,
    skippedNotDelivered: 0,
    skippedOther: 0,
    totalAmount: 0,
  };

  const eligible = [];
  const skipped = [];

  for (const order of orders) {
    const { eligible: isEligible, reason } = classifyOrder(order, filters);
    if (isEligible) {
      summary.eligible += 1;
      summary.totalAmount += Number(order.amount) || 0;
      eligible.push(order);
    } else {
      if (reason === "already_invoiced") summary.skippedAlreadyInvoiced += 1;
      else if (reason === "not_delivered") summary.skippedNotDelivered += 1;
      else summary.skippedOther += 1;
      skipped.push({ ...mapOrderRow(order), skipReason: reason });
    }
  }

  return { summary, eligible, skipped };
}

export async function previewBulkInvoices(orderModel, rawFilters) {
  const filters = parseBulkInvoiceFilters(rawFilters);
  const { summary, eligible, skipped } = await queryOrdersForBulkInvoice(
    orderModel,
    filters
  );

  return {
    success: true,
    range: {
      from: filters.range.from,
      to: filters.range.to,
      preset: filters.preset,
      dateField: filters.dateField,
    },
    filters: {
      deliveredOnly: filters.deliveredOnly,
      missingInvoiceOnly: filters.missingInvoiceOnly,
      paymentMethods: filters.paymentMethods,
      minAmount: filters.minAmount,
    },
    summary,
    orders: eligible.slice(0, PREVIEW_LIST_CAP).map(mapOrderRow),
    skippedSample: skipped.slice(0, 50),
    listCapped: eligible.length > PREVIEW_LIST_CAP,
    eligibleTotal: eligible.length,
  };
}

export async function executeBulkIssue(orderModel, rawFilters) {
  const filters = parseBulkInvoiceFilters(rawFilters);
  const { eligible } = await queryOrdersForBulkInvoice(orderModel, filters);

  const batch = eligible.slice(0, filters.limit);
  const result = {
    success: true,
    processed: batch.length,
    issued: 0,
    skipped: 0,
    failed: 0,
    failures: [],
    issuedInvoiceNumbers: [],
    remainingEligible: Math.max(0, eligible.length - batch.length),
  };

  for (const row of batch) {
    try {
      const order = await orderModel.findById(row._id);
      if (!order) {
        result.failed += 1;
        result.failures.push({ orderId: row._id, message: "Order not found" });
        continue;
      }

      const check = classifyOrder(order, filters);
      if (!check.eligible) {
        result.skipped += 1;
        continue;
      }

      const issueResult = await issueInvoiceForOrder(order);
      if (!issueResult.ok) {
        result.failed += 1;
        result.failures.push({
          orderId: order._id,
          message: issueResult.reason || "Could not issue invoice",
        });
        continue;
      }

      if (issueResult.skipped) {
        result.skipped += 1;
        continue;
      }

      if (filters.sendEmail && issueResult.config) {
        try {
          await emailInvoiceToCustomer(order, issueResult.config);
        } catch (mailErr) {
          console.error("bulk invoice email:", mailErr.message);
        }
      }

      result.issued += 1;
      result.issuedInvoiceNumbers.push(issueResult.invoice?.number || "");
    } catch (err) {
      result.failed += 1;
      result.failures.push({
        orderId: row._id,
        message: err.message || "Unexpected error",
      });
    }
  }

  return result;
}

/** Set deliveredAt when all active items are Delivered (once). */
export async function markDeliveredAtIfComplete(order) {
  if (!order || !orderIsFullyDelivered(order) || order.deliveredAt) {
    return false;
  }
  order.deliveredAt = new Date();
  await order.save();
  return true;
}
