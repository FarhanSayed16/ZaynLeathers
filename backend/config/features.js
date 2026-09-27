const truthy = (value) => String(value ?? "").trim().toLowerCase() === "true";

/** White-label modules. Flip in backend .env — no code changes per client. */
export function getFeatureFlags() {
  return {
    recommendations: truthy(process.env.FEATURE_RECOMMENDATIONS ?? "true"),
    razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    partialPayment: truthy(process.env.PARTIAL_PAYMENT_ENABLED),
    shipping: truthy(process.env.SHIPPING_ENABLED),
    whatsapp: truthy(process.env.FEATURE_WHATSAPP),
    coupons: truthy(process.env.FEATURE_COUPONS ?? "true"),
    instagram: truthy(process.env.FEATURE_INSTAGRAM ?? "true"),
    reviews: truthy(process.env.FEATURE_REVIEWS ?? "true"),
    wishlist: truthy(process.env.FEATURE_WISHLIST ?? "true"),
    catalogVariants: truthy(process.env.FEATURE_CATALOG_VARIANTS ?? "true"),
    multiCurrency: truthy(process.env.FEATURE_MULTI_CURRENCY ?? "true"),
    partnerOrders: truthy(process.env.FEATURE_PARTNER_ORDERS),
    invoicing: truthy(process.env.FEATURE_INVOICING),
    analyticsPro: truthy(process.env.FEATURE_ANALYTICS_PRO),
  };
}

export function isFeatureEnabled(name) {
  return Boolean(getFeatureFlags()[name]);
}
