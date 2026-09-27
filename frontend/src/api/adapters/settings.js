/**
 * ============================================================
 * Settings Adapter — WordPress ↔ Frontend
 * ============================================================
 * Fetches site settings from WordPress options / custom fields.
 * These are configured in the WordPress admin panel.
 * ============================================================
 */

import { wpUrl, wcUrl, request } from "../wooClient.js";

/**
 * Fetch site settings that the frontend needs.
 * This maps to your current `/api/settings` endpoint.
 *
 * Some of these come from WooCommerce settings, others from
 * WordPress options via a custom endpoint.
 */
export async function fetchSettings() {
  // Try custom Zayn settings endpoint first
  try {
    const url = wpUrl("zayn/v1/settings");
    const data = await request(url);

    return {
      deliveryFee: Number(data.deliveryFee ?? 41),
      freeShippingThreshold: Number(data.freeShippingThreshold ?? 0),
      codEnabled: data.codEnabled !== false,
      features: {
        invoicing: data.features?.invoicing || false,
        videoReviews: data.features?.videoReviews || false,
      },
      partialPaymentConfig: data.partialPaymentConfig || null,
      promoStrip: data.promoStrip || null,
      announcement: data.announcement || null,
    };
  } catch {
    // Fallback: construct settings from WooCommerce defaults
    return {
      deliveryFee: 41,
      freeShippingThreshold: 0,
      codEnabled: true,
      features: { invoicing: false, videoReviews: false },
      partialPaymentConfig: null,
      promoStrip: null,
      announcement: null,
    };
  }
}

/**
 * Fetch exchange rates.
 * Uses a custom endpoint or a free API.
 */
export async function fetchExchangeRates() {
  try {
    const url = wpUrl("zayn/v1/exchange-rates");
    const data = await request(url);
    return data.rates || { USD: 0, GBP: 0, CAD: 0 };
  } catch {
    // Fallback: use a free exchange rate API
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

/**
 * Fetch hero banners.
 * These are typically managed via WordPress custom post type or ACF.
 */
export async function fetchHeroBanners() {
  try {
    const url = wpUrl("zayn/v1/hero-banners");
    const data = await request(url);
    return data.banners || [];
  } catch {
    // Return brand defaults if custom endpoint not available
    return null; // null = use brand.media.heroes from brand config
  }
}

/**
 * Fetch Instagram promo posts.
 */
export async function fetchInstagramPromos() {
  try {
    const url = wpUrl("zayn/v1/instagram-promos");
    const data = await request(url);
    return data.promos || [];
  } catch {
    return []; // Empty = use fallback images from brand config
  }
}
