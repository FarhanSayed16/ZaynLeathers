/**
 * ============================================================
 * Settings Adapter — WordPress ↔ Frontend
 * ============================================================
 */

import { wpUrl, request } from "../wooClient.js";

function parseMaybeJson(value, fallback = null) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      // Plain string promo message
      if (fallback && typeof fallback === "object" && "message" in fallback) {
        return { ...fallback, message: value, isActive: true };
      }
      return value;
    }
  }
  return fallback;
}

export async function fetchSettings() {
  try {
    const url = wpUrl("zayn/v1/settings");
    const data = await request(url);

    const promoStrip = parseMaybeJson(data.promoStrip, null);
    const homeConfig = parseMaybeJson(data.homeConfig, {}) || {};

    return {
      deliveryFee: Number(data.deliveryFee ?? 41),
      // Default 2999 aligns with brand promo copy when WP option unset
      freeShippingThreshold: Number(
        data.freeShippingThreshold ?? data.free_shipping_threshold ?? 2999
      ),
      codEnabled: data.codEnabled !== false,
      features: {
        invoicing: data.features?.invoicing || false,
        videoReviews: data.features?.videoReviews || false,
      },
      partialPaymentConfig: data.partialPaymentConfig || null,
      promoStrip:
        promoStrip && typeof promoStrip === "object"
          ? {
              isActive: promoStrip.isActive !== false,
              message: promoStrip.message || "",
              link: promoStrip.link || "",
            }
          : promoStrip
            ? { isActive: true, message: String(promoStrip), link: "" }
            : null,
      announcement: data.announcement || null,
      homeConfig: {
        featuredProductIds: homeConfig.featuredProductIds || [],
        newArrivalProductIds: homeConfig.newArrivalProductIds || [],
        bestsellerProductIds: homeConfig.bestsellerProductIds || [],
      },
    };
  } catch {
    return {
      deliveryFee: 41,
      freeShippingThreshold: 2999,
      codEnabled: true,
      features: { invoicing: false, videoReviews: false },
      partialPaymentConfig: null,
      promoStrip: null,
      announcement: null,
      homeConfig: {
        featuredProductIds: [],
        newArrivalProductIds: [],
        bestsellerProductIds: [],
      },
    };
  }
}

export async function fetchExchangeRates() {
  try {
    const url = wpUrl("zayn/v1/exchange-rates");
    const data = await request(url);
    return data.rates || { USD: 0, GBP: 0, CAD: 0 };
  } catch {
    try {
      const res = await fetch(
        "https://api.exchangerate-api.com/v4/latest/INR"
      );
      const data = await res.json();
      return {
        USD: data.rates?.USD || 0,
        GBP: data.rates?.GBP || 0,
        CAD: data.rates?.CAD || 0,
      };
    } catch {
      return { USD: 0, GBP: 0, CAD: 0 };
    }
  }
}

export async function fetchHeroBanners() {
  try {
    const url = wpUrl("zayn/v1/hero-banners");
    const data = await request(url);
    return data.banners || [];
  } catch {
    return null;
  }
}

export async function fetchInstagramPromos() {
  try {
    const url = wpUrl("zayn/v1/instagram-promos");
    const data = await request(url);
    return data.promos || [];
  } catch {
    return [];
  }
}
