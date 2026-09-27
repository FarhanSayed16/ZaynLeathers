import orderModel from "../../models/orderModel.js";
import SiteSettings from "../../models/SiteSettings.js";
import { isFeatureEnabled } from "../../config/features.js";
import brand from "../../../shared/brand.config.js";
import { sendEmail } from "../mailer.js";
import {
  buildAnalyticsSummary,
  topProducts,
} from "./queries.js";
import { istYmd, istYesterdayYmd } from "./dateRange.js";

export async function resolveDigestConfig() {
  const settings = await SiteSettings.findOne({ singleton: "default" }).lean();
  const digest = settings?.analyticsDigest || {};
  const email =
    String(digest.email || "").trim() ||
    String(process.env.ANALYTICS_DIGEST_EMAIL || "").trim() ||
    String(process.env.ADMIN_EMAIL || "").trim();

  return {
    enabled: Boolean(digest.enabled),
    email,
    lastSentAt: digest.lastSentAt || null,
  };
}

async function countBalanceDue() {
  return orderModel.countDocuments({
    paymentMethod: "Partial",
    advancePaid: true,
    balancePaid: { $ne: true },
    $expr: {
      $gt: [
        {
          $size: {
            $filter: {
              input: "$items",
              as: "i",
              cond: { $ne: ["$$i.status", "Cancelled"] },
            },
          },
        },
        0,
      ],
    },
  });
}

async function countPendingOrders() {
  return orderModel.countDocuments({
    $expr: {
      $gt: [
        {
          $size: {
            $filter: {
              input: "$items",
              as: "i",
              cond: {
                $not: { $in: ["$$i.status", ["Delivered", "Cancelled"]] },
              },
            },
          },
        },
        0,
      ],
    },
  });
}

function formatInr(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function buildDigestHtml({
  dateLabel,
  orders,
  grossRevenue,
  netRevenue,
  topProducts: products,
  balanceDue,
  pendingOrders,
  analyticsLink,
}) {
  const productRows =
    products.length > 0
      ? products
          .map(
            (p, i) =>
              `<tr>
                <td style="padding:6px 8px;border-bottom:1px solid #eee;">${i + 1}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #eee;">${p.name || "Product"}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${formatInr(p.revenue)}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${p.units || 0}</td>
              </tr>`
          )
          .join("")
      : `<tr><td colspan="4" style="padding:8px;color:#666;">No product sales yesterday</td></tr>`;

  const analyticsBlock = analyticsLink
    ? `<p style="margin:20px 0;"><a href="${analyticsLink}" style="display:inline-block;padding:10px 18px;background:#1c1917;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Open Analytics Pro</a></p>`
    : "";

  return `
    <div style="font-family:system-ui,sans-serif;color:#1c1917;max-width:560px;">
      <h2 style="margin:0 0 4px;">Daily store digest</h2>
      <p style="margin:0 0 16px;color:#666;">${dateLabel} (IST) — ${brand.name || "Zayn Leathers"}</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tr><td style="padding:8px 0;color:#666;">Orders</td><td style="padding:8px 0;text-align:right;font-weight:600;">${orders}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Gross revenue</td><td style="padding:8px 0;text-align:right;font-weight:600;">${formatInr(grossRevenue)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Net revenue</td><td style="padding:8px 0;text-align:right;font-weight:600;">${formatInr(netRevenue)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Pending orders</td><td style="padding:8px 0;text-align:right;font-weight:600;">${pendingOrders}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Partial — balance due</td><td style="padding:8px 0;text-align:right;font-weight:600;">${balanceDue}</td></tr>
      </table>

      <h3 style="margin:16px 0 8px;font-size:15px;">Top products by revenue</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f5f5f4;">
            <th style="padding:6px 8px;text-align:left;">#</th>
            <th style="padding:6px 8px;text-align:left;">Product</th>
            <th style="padding:6px 8px;text-align:right;">Revenue</th>
            <th style="padding:6px 8px;text-align:right;">Units</th>
          </tr>
        </thead>
        <tbody>${productRows}</tbody>
      </table>

      ${analyticsBlock}
      <p style="font-size:12px;color:#888;margin-top:24px;">Automated digest from Analytics Pro. Turn off in Admin → Analytics.</p>
    </div>
  `;
}

export async function sendAnalyticsDigest({ force = false, date } = {}) {
  if (!isFeatureEnabled("analyticsPro")) {
    const err = new Error("Analytics Pro is not enabled on this deployment");
    err.statusCode = 409;
    throw err;
  }

  const config = await resolveDigestConfig();
  if (!force && !config.enabled) {
    return { success: false, skipped: "disabled", message: "Daily digest is turned off" };
  }
  if (!config.email) {
    return { success: false, skipped: "no_email", message: "No digest recipient configured" };
  }

  const yesterday = date || istYesterdayYmd();
  const summary = await buildAnalyticsSummary({ from: yesterday, to: yesterday });
  const products = await topProducts({ from: yesterday, to: yesterday, limit: 5 });
  const [balanceDue, pendingOrders] = await Promise.all([
    countBalanceDue(),
    countPendingOrders(),
  ]);

  const adminUrl = String(process.env.ADMIN_URL || "").replace(/\/$/, "");
  const analyticsLink = adminUrl ? `${adminUrl}/analytics` : "";
  const cur = summary.current;

  const html = buildDigestHtml({
    dateLabel: yesterday,
    orders: cur.orderCount,
    grossRevenue: cur.grossRevenue,
    netRevenue: cur.netRevenue,
    topProducts: products,
    balanceDue,
    pendingOrders,
    analyticsLink,
  });

  await sendEmail({
    to: config.email,
    subject: `Daily digest — ${yesterday} — ${brand.name || "Store"}`,
    html,
  });

  await SiteSettings.findOneAndUpdate(
    { singleton: "default" },
    { $set: { "analyticsDigest.lastSentAt": new Date() } },
    { upsert: true }
  );

  return {
    success: true,
    sentTo: config.email,
    date: yesterday,
    orders: cur.orderCount,
    grossRevenue: cur.grossRevenue,
  };
}

export async function updateDigestSettings({ enabled, email }) {
  const patch = {};
  if (enabled !== undefined) patch["analyticsDigest.enabled"] = Boolean(enabled);
  if (email !== undefined) patch["analyticsDigest.email"] = String(email || "").trim();

  await SiteSettings.findOneAndUpdate(
    { singleton: "default" },
    { $set: patch },
    { upsert: true }
  );

  return resolveDigestConfig();
}
