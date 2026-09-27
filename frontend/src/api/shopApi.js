/**
 * Unified shop API — single entry for ShopContext and pages.
 * Routes to WooCommerce adapters or the legacy Express backend.
 */

import axios from "axios";
import { isWooMode, getApiBase } from "./mode.js";
import { authHeaders } from "../utils/india";
import * as wooProducts from "./adapters/products.js";
import * as wooCategories from "./adapters/categories.js";
import * as wooSettings from "./adapters/settings.js";
import * as wooAuth from "./adapters/auth.js";
import * as wooCart from "./adapters/cart.js";
import * as wooWishlist from "./adapters/wishlist.js";
import * as wooOrders from "./adapters/orders.js";
import * as wooCoupons from "./adapters/coupons.js";
import * as wooReviews from "./adapters/reviews.js";

const nodeBase = () => getApiBase();

/** Cached Store API cart (Woo) for item-key lookups on update/remove. */
let wooRawCart = null;

function setWooRaw(raw) {
  wooRawCart = raw || null;
}

async function nodeGet(path, token) {
  const res = await axios.get(`${nodeBase()}${path}`, {
    headers: token ? authHeaders(token) : undefined,
  });
  return res.data;
}

async function nodePost(path, body, token) {
  const res = await axios.post(`${nodeBase()}${path}`, body || {}, {
    headers: token ? authHeaders(token) : undefined,
  });
  return res.data;
}

/* ── Products ─────────────────────────────────────────────── */

export async function listProducts() {
  if (isWooMode) {
    const products = await wooProducts.fetchAllProducts();
    return { success: true, products };
  }
  return nodeGet("/api/product/list");
}

export async function getProduct(productId) {
  if (isWooMode) {
    const product = await wooProducts.fetchProduct(productId);
    return { success: true, product };
  }
  return nodeGet(`/api/product/${productId}`);
}

/* ── Categories ───────────────────────────────────────────── */

export async function getCategoryTree() {
  if (isWooMode) {
    const { categories, tree } = await wooCategories.fetchCategoryTree();
    return { success: true, categories, tree };
  }
  return nodeGet("/api/categories/tree");
}

/* ── Settings / rates ─────────────────────────────────────── */

export async function getSettings() {
  if (isWooMode) {
    const settings = await wooSettings.fetchSettings();
    return { success: true, settings };
  }
  return nodeGet("/api/settings");
}

export async function getExchangeRates() {
  if (isWooMode) {
    const rates = await wooSettings.fetchExchangeRates();
    return { success: true, rates };
  }
  return nodeGet("/api/exchange-rates");
}

/* ── Auth ─────────────────────────────────────────────────── */

export async function login(email, password, rememberMe = true) {
  if (isWooMode) {
    const data = await wooAuth.login(email, password);
    return {
      success: true,
      token: data.token,
      user: data.user,
    };
  }
  return nodePost("/api/user/login", { email, password, rememberMe });
}

/**
 * Register. In Woo mode: create WC customer then JWT login (no OTP).
 * In Node mode: starts OTP flow (returns success without token).
 */
export async function register(form) {
  if (isWooMode) {
    await wooAuth.register({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
    });
    const data = await wooAuth.login(form.email, form.password);
    return {
      success: true,
      token: data.token,
      user: data.user,
      skipOtp: true,
    };
  }
  return nodePost("/api/user/register", form);
}

export async function verifyOtp(payload) {
  if (isWooMode) {
    throw new Error("OTP verification is not used in WooCommerce mode");
  }
  return nodePost("/api/user/verify-otp", payload);
}

export async function resendOtp(payload) {
  if (isWooMode) {
    throw new Error("OTP resend is not used in WooCommerce mode");
  }
  return nodePost("/api/user/resend-otp", payload);
}

export async function getProfile(token) {
  if (isWooMode) {
    const user = await wooAuth.getProfile(token);
    return { success: true, user };
  }
  return nodeGet("/api/user/profile", token);
}

export async function forgotPassword(email) {
  if (isWooMode) {
    return wooAuth.forgotPassword(email);
  }
  return nodePost("/api/user/forgot-password", { email });
}

export async function resetPassword(token, password, email = "") {
  if (isWooMode) {
    return wooAuth.resetPassword(token, password, email);
  }
  return nodePost("/api/user/reset-password", { token, password });
}

/* ── Cart ─────────────────────────────────────────────────── */

export async function addToCart(itemId, size, token) {
  if (isWooMode) {
    // Guest: local only (caller updates localStorage). Logged-in: Store API.
    if (!token) {
      return { success: true, localOnly: true };
    }
    const { cartData, raw } = await wooCart.addToCart(itemId, size, 1, token);
    setWooRaw(raw);
    return { success: true, cartData };
  }
  return nodePost("/api/cart/add", { itemId, size }, token);
}

export async function updateCart(itemId, size, quantity, token) {
  if (isWooMode) {
    if (!token) {
      return { success: true, localOnly: true };
    }
    if (!wooRawCart) {
      const { raw } = await wooCart.getCart(token);
      setWooRaw(raw);
    }
    const keyMap = wooCart.buildItemKeyMap(wooRawCart);
    const itemKey = keyMap[`${itemId}:${size}`];
    if (!itemKey) {
      if (quantity > 0) {
        const { cartData, raw } = await wooCart.addToCart(
          itemId,
          size,
          quantity,
          token
        );
        setWooRaw(raw);
        return { success: true, cartData };
      }
      return { success: true, cartData: {} };
    }
    const { cartData, raw } = await wooCart.updateCartItem(
      itemKey,
      quantity,
      token
    );
    setWooRaw(raw);
    return { success: true, cartData };
  }
  return nodePost("/api/cart/update", { itemId, size, quantity }, token);
}

export async function getCart(token) {
  if (isWooMode) {
    const { cartData, raw } = await wooCart.getCart(token);
    setWooRaw(raw);
    return { success: true, cartData };
  }
  return nodePost("/api/cart/get", {}, token);
}

export async function mergeCart(guestCart, token) {
  if (isWooMode) {
    const { cartData, raw } = await wooCart.mergeGuestCart(guestCart, token);
    setWooRaw(raw);
    return { success: true, cartData };
  }
  return nodePost("/api/cart/merge", { guestCart }, token);
}

/* ── Wishlist ─────────────────────────────────────────────── */

export async function getWishlist(token) {
  if (isWooMode) {
    const wishlist = await wooWishlist.getWishlist(token);
    return { success: true, wishlist };
  }
  return nodePost("/api/wishlist/get", {}, token);
}

export async function addWishlist(productId, token) {
  if (isWooMode) {
    await wooWishlist.addToWishlist(productId, token);
    return { success: true };
  }
  return nodePost("/api/wishlist/add", { productId }, token);
}

export async function removeWishlist(productId, token) {
  if (isWooMode) {
    await wooWishlist.removeFromWishlist(productId, token);
    return { success: true };
  }
  return nodePost("/api/wishlist/update", { productId }, token);
}

/* ── Orders (used by PlaceOrder / Orders pages) ───────────── */

export async function placeCodOrder(orderData, token) {
  if (isWooMode) {
    return wooOrders.placeCodOrder(orderData, token);
  }
  return nodePost("/api/order/place", orderData, token);
}

export async function createRazorpayOrder(orderData, token) {
  if (isWooMode) {
    return wooOrders.createRazorpayOrder(orderData, token);
  }
  return nodePost("/api/order/razorpay", orderData, token);
}

export async function verifyRazorpay(paymentData, token) {
  if (isWooMode) {
    return wooOrders.verifyRazorpayPayment(paymentData, token);
  }
  return nodePost("/api/order/verifyRazorpay", paymentData, token);
}

export async function getUserOrders(token) {
  if (isWooMode) {
    const orders = await wooOrders.getOrders(token);
    return { success: true, orders };
  }
  return nodePost("/api/order/userorders", {}, token);
}

export async function getOrder(orderId, token) {
  if (isWooMode) {
    const order = await wooOrders.getOrder(orderId, token);
    return { success: true, order };
  }
  return nodeGet(`/api/order/${orderId}`, token);
}

/* ── Coupons ──────────────────────────────────────────────── */

export async function getActiveCoupons() {
  if (isWooMode) {
    const coupons = await wooCoupons.fetchActiveCoupons();
    return { success: true, coupons };
  }
  return nodeGet("/api/coupons/active");
}

export async function validateCoupon(code, amount) {
  if (isWooMode) {
    const result = await wooCoupons.validateCoupon(code);
    if (!result.valid) {
      return { valid: false, error: result.message };
    }
    if (result.minimumAmount && amount < result.minimumAmount) {
      return {
        valid: false,
        error: `Minimum order ₹${result.minimumAmount} required`,
      };
    }
    // Frontend CouponInput expects percent-style `discount` for display math
    const discount =
      result.discountType === "percent"
        ? result.discount
        : result._mapped?.discount || result.discount;
    return {
      valid: true,
      discount: discount ?? result.discount,
      code: result.code,
      discountType: result.discountType,
      fixedDiscount: result._mapped?.fixedDiscount ?? null,
    };
  }
  return nodeGet(
    `/api/coupons/validate/${encodeURIComponent(code)}?amount=${amount || 0}`
  );
}

/* ── Reviews ──────────────────────────────────────────────── */

export async function getProductReviews(productId) {
  if (isWooMode) {
    const reviews = await wooReviews.fetchProductReviews(productId);
    // Map to shape ReviewSection expects: name, comment, rating, _id
    return reviews.map((r) => ({
      _id: r._id,
      name: r.reviewer,
      comment: r.reviewText || r.review,
      rating: r.rating,
      date: r.date,
    }));
  }
  const res = await axios.get(`${nodeBase()}/api/reviews/${productId}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function submitProductReview(
  { productId, comment, rating },
  token,
  user
) {
  if (isWooMode) {
    const reviewer =
      `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
      user?.email ||
      "Customer";
    await wooReviews.submitReview({
      productId,
      reviewer,
      reviewerEmail: user?.email || "",
      rating,
      review: comment,
    });
    return { success: true };
  }
  return nodePost(
    "/api/reviews",
    { productId, comment, rating },
    token
  );
}

/* ── Contact / CMS extras ─────────────────────────────────── */

export async function submitContact(formData) {
  if (isWooMode) {
    const { wpUrl, request } = await import("./wooClient.js");
    return request(wpUrl("zayn/v1/contact"), {
      method: "POST",
      body: JSON.stringify(formData),
    });
  }
  return nodePost("/api/contact", formData);
}

export async function getHeroBanners() {
  if (isWooMode) {
    const banners = await wooSettings.fetchHeroBanners();
    return { success: true, heroes: banners || [] };
  }
  return nodeGet("/api/admin/hero");
}

export async function getInstagramPromos() {
  if (isWooMode) {
    const promos = await wooSettings.fetchInstagramPromos();
    return { success: true, promos: promos || [] };
  }
  return nodeGet("/api/instagram");
}

export async function getVideoReviews() {
  if (isWooMode) {
    // Not supported on Woo path — return empty
    return [];
  }
  const res = await axios.get(`${nodeBase()}/api/video-reviews`);
  return res.data || [];
}

/* ── Account profile / password / addresses ───────────────── */

export async function updateProfile(updates, token) {
  if (isWooMode) {
    const user = await wooAuth.updateProfile(token, updates);
    return { success: true, user };
  }
  const res = await axios.put(`${nodeBase()}/api/user/profile`, updates, {
    headers: authHeaders(token),
  });
  return res.data;
}

export async function changePassword(payload, token) {
  if (isWooMode) {
    const { wpUrl, authRequest } = await import("./wooClient.js");
    return authRequest(wpUrl("zayn/v1/change-password"), token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  const res = await axios.put(`${nodeBase()}/api/user/password`, payload, {
    headers: authHeaders(token),
  });
  return res.data;
}

export async function saveAddress(form, editingId, token) {
  if (isWooMode) {
    const { wpUrl, authRequest } = await import("./wooClient.js");
    return authRequest(wpUrl("zayn/v1/addresses"), token, {
      method: editingId ? "PUT" : "POST",
      body: JSON.stringify({ ...form, addressId: editingId || undefined }),
    });
  }
  const url = editingId
    ? `${nodeBase()}/api/user/addresses/${editingId}`
    : `${nodeBase()}/api/user/addresses`;
  const res = await axios[editingId ? "put" : "post"](url, form, {
    headers: authHeaders(token),
  });
  return res.data;
}

export async function deleteAddress(id, token) {
  if (isWooMode) {
    const { wpUrl, authRequest } = await import("./wooClient.js");
    return authRequest(wpUrl("zayn/v1/addresses"), token, {
      method: "DELETE",
      body: JSON.stringify({ addressId: id }),
    });
  }
  const res = await axios.delete(`${nodeBase()}/api/user/addresses/${id}`, {
    headers: authHeaders(token),
  });
  return res.data;
}

export async function setDefaultAddress(id, token) {
  if (isWooMode) {
    // Woo billing/shipping: mark which slot is default via plugin
    const { wpUrl, authRequest } = await import("./wooClient.js");
    return authRequest(wpUrl("zayn/v1/addresses/default"), token, {
      method: "POST",
      body: JSON.stringify({ addressId: id }),
    });
  }
  const res = await axios.put(
    `${nodeBase()}/api/user/addresses/${id}/default`,
    {},
    { headers: authHeaders(token) }
  );
  return res.data;
}

export { isWooMode, getApiBase };
