import SiteSettings from "../models/SiteSettings.js";

export const isPartialPaymentEnvEnabled = () =>
  String(process.env.PARTIAL_PAYMENT_ENABLED || "").toLowerCase() === "true";

export const getPartialPaymentBounds = () => {
  const defaultPercent = Number(process.env.PARTIAL_PAYMENT_PERCENT_DEFAULT || 20);
  const minPercent = Number(process.env.PARTIAL_PAYMENT_MIN_PERCENT || 10);
  const maxPercent = Number(process.env.PARTIAL_PAYMENT_MAX_PERCENT || 50);
  const minAdvance = Number(process.env.PARTIAL_PAYMENT_MIN_ADVANCE || 50);
  return {
    defaultPercent: Number.isFinite(defaultPercent) ? defaultPercent : 20,
    minPercent: Number.isFinite(minPercent) ? minPercent : 10,
    maxPercent: Number.isFinite(maxPercent) ? maxPercent : 50,
    minAdvance: Number.isFinite(minAdvance) && minAdvance >= 0 ? minAdvance : 50,
  };
};

export const clampPartialPercent = (value) => {
  const { defaultPercent, minPercent, maxPercent } = getPartialPaymentBounds();
  const n = Number(value);
  if (!Number.isFinite(n)) return defaultPercent;
  return Math.min(maxPercent, Math.max(minPercent, Math.round(n)));
};

/**
 * Compute advance / balance from order total.
 * Applies min advance floor when total is large enough; otherwise charges full amount.
 */
export const computeAdvanceBreakdown = (orderTotal, percent, minAdvanceOverride = null) => {
  const total = Math.max(0, Math.round(Number(orderTotal) || 0));
  const pct = clampPartialPercent(percent);
  const { minAdvance: envMin } = getPartialPaymentBounds();
  const minAdvance = Number.isFinite(Number(minAdvanceOverride))
    ? Math.max(0, Math.round(Number(minAdvanceOverride)))
    : envMin;

  if (total <= 0) {
    return {
      orderTotal: 0,
      advancePercent: pct,
      advanceAmount: 0,
      balanceAmount: 0,
      minAdvanceApplied: false,
      chargedFull: false,
    };
  }

  let advanceAmount = Math.round((total * pct) / 100);
  let minAdvanceApplied = false;
  let chargedFull = false;

  if (advanceAmount < 1) advanceAmount = 1;

  // Floor: at least minAdvance, unless order is smaller → charge full (no tiny COD remainder)
  if (minAdvance > 0 && advanceAmount < minAdvance) {
    if (total <= minAdvance) {
      advanceAmount = total;
      chargedFull = true;
    } else {
      advanceAmount = minAdvance;
      minAdvanceApplied = true;
    }
  }

  if (advanceAmount > total) advanceAmount = total;
  const balanceAmount = total - advanceAmount;

  return {
    orderTotal: total,
    advancePercent: pct,
    advanceAmount,
    balanceAmount,
    minAdvanceApplied,
    chargedFull,
    effectiveAdvancePercent:
      total > 0 ? Math.round((advanceAmount / total) * 1000) / 10 : pct,
  };
};

/**
 * Effective config for storefront + admin.
 * Env OFF → enabled: false always.
 */
export async function resolvePartialPaymentConfig() {
  const bounds = getPartialPaymentBounds();
  const envEnabled = isPartialPaymentEnvEnabled();

  let settings = null;
  try {
    settings = await SiteSettings.findOne({ singleton: "default" }).lean();
  } catch {
    /* ignore */
  }

  const stored = settings?.partialPayment || {};
  const percent = clampPartialPercent(
    stored.percent != null ? stored.percent : bounds.defaultPercent
  );
  const minAdvance =
    stored.minAdvanceAmount != null && Number.isFinite(Number(stored.minAdvanceAmount))
      ? Math.max(0, Math.round(Number(stored.minAdvanceAmount)))
      : bounds.minAdvance;

  const active = stored.active !== false;
  const replaceCod = stored.replaceCod !== false;
  const label =
    stored.label ||
    `Pay ${percent}% now, rest on delivery`;
  const policyNotice =
    stored.policyNotice ||
    `Paying ${percent}% now reserves your order and helps cover logistics. If the parcel is refused or returned undelivered, the advance may be retained as per our policy. The remaining amount is payable only on successful delivery.`;

  return {
    envEnabled,
    enabled: envEnabled && active,
    active,
    percent,
    minAdvance,
    label,
    policyNotice,
    replaceCod,
    keepAdvanceOnRto: stored.keepAdvanceOnRto !== false,
    minPercent: bounds.minPercent,
    maxPercent: bounds.maxPercent,
    defaultPercent: bounds.defaultPercent,
  };
}
