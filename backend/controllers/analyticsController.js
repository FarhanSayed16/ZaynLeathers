import {
  buildAnalyticsSummary,
  couponPerformance,
  exportCustomerRows,
  exportOrdersRows,
  exportProductRows,
  topProducts,
} from "../utils/analytics/queries.js";
import { escapeCsv } from "../utils/analytics/dateRange.js";
import {
  resolveDigestConfig,
  sendAnalyticsDigest,
  updateDigestSettings,
} from "../utils/analytics/digest.js";

export const getDigestSettings = async (_req, res) => {
  try {
    const config = await resolveDigestConfig();
    res.json({ success: true, digest: config });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const putDigestSettings = async (req, res) => {
  try {
    const { enabled, email } = req.body || {};
    const digest = await updateDigestSettings({ enabled, email });
    res.json({ success: true, digest, message: "Digest settings saved" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const runDigest = async (req, res) => {
  try {
    const force = req.query.force === "1" || req.query.force === "true";
    const result = await sendAnalyticsDigest({ force });
    if (result.skipped) {
      return res.status(200).json({ success: false, ...result });
    }
    res.json({ success: true, ...result });
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getSummary = async (req, res) => {
  try {
    const { from, to, compareFrom, compareTo } = req.query;
    const data = await buildAnalyticsSummary({ from, to, compareFrom, compareTo });
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { from, to, limit, sort } = req.query;
    const products = await topProducts({ from, to, limit, sort });
    res.json({ success: true, products });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const { from, to } = req.query;
    const coupons = await couponPerformance({ from, to });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

function sendCsv(res, filename, header, rows) {
  const lines = [header.join(","), ...rows.map((row) => row.map(escapeCsv).join(","))];
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(lines.join("\n"));
}

export const exportOrders = async (req, res) => {
  try {
    const { from, to } = req.query;
    const { rows, truncated, maxRows } = await exportOrdersRows({ from, to });
    const header = [
      "orderId",
      "orderDate",
      "customer",
      "phone",
      "email",
      "city",
      "state",
      "productId",
      "productName",
      "sku",
      "color",
      "size",
      "department",
      "quantity",
      "unitPrice",
      "lineTotal",
      "itemStatus",
      "orderTotal",
      "paymentMethod",
      "paid",
      "couponCode",
      "invoiceNumber",
    ];
    const data = rows.map((r) => header.map((k) => r[k]));
    if (truncated) {
      res.setHeader("X-Export-Truncated", "true");
      res.setHeader("X-Export-Max-Rows", String(maxRows));
    }
    sendCsv(
      res,
      `orders-export-${from || "start"}-${to || "end"}.csv`,
      header,
      data
    );
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const exportProducts = async (req, res) => {
  try {
    const { from, to } = req.query;
    const products = await exportProductRows({ from, to });
    const header = ["productId", "name", "sku", "department", "revenue", "units", "orderCount"];
    const data = products.map((p) =>
      header.map((k) => (k === "productId" ? p.productId : p[k]))
    );
    sendCsv(res, `products-export-${from || "start"}-${to || "end"}.csv`, header, data);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const exportCustomers = async (req, res) => {
  try {
    const { from, to } = req.query;
    const customers = await exportCustomerRows({ from, to });
    const header = ["userId", "name", "email", "phone", "orders", "revenue", "lastOrderAt"];
    const data = customers.map((c) => header.map((k) => c[k]));
    sendCsv(res, `customers-export-${from || "start"}-${to || "end"}.csv`, header, data);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
