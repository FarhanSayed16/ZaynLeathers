/**
 * ============================================================
 * Reviews Adapter — WooCommerce ↔ Frontend
 * ============================================================
 * Uses the built-in WooCommerce product reviews endpoint.
 * ============================================================
 */

import { wcUrl, request, authRequest, wpUrl } from "../wooClient.js";

/**
 * Map a WooCommerce review → frontend review shape.
 */
function mapReview(wc) {
  return {
    _id: String(wc.id),
    productId: String(wc.product_id),
    reviewer: wc.reviewer || "Anonymous",
    reviewerEmail: wc.reviewer_email || "",
    rating: wc.rating || 5,
    review: wc.review || "",           // HTML content
    reviewText: stripHtml(wc.review),  // Plain text
    verified: wc.verified || false,
    date: wc.date_created,
    avatar: wc.reviewer_avatar_urls?.["48"] || "",
    status: wc.status,                 // "approved", "hold", "spam", "trash"
  };
}

/**
 * Fetch reviews for a specific product.
 * @param {string} productId
 */
export async function fetchProductReviews(productId) {
  const url = wcUrl("products/reviews", {
    product: productId,
    per_page: 50,
    status: "approved",
    orderby: "date_created",
    order: "desc",
  });

  const reviews = await request(url);
  return reviews.map(mapReview);
}

/**
 * Submit a new review.
 * @param {Object} params
 * @param {string} params.productId
 * @param {string} params.reviewer - Reviewer name
 * @param {string} params.reviewerEmail
 * @param {number} params.rating - 1–5
 * @param {string} params.review - Review text
 */
export async function submitReview({ productId, reviewer, reviewerEmail, rating, review }) {
  const url = wcUrl("products/reviews");

  const data = await request(url, {
    method: "POST",
    body: JSON.stringify({
      product_id: Number(productId),
      reviewer,
      reviewer_email: reviewerEmail,
      rating,
      review,
    }),
  });

  return mapReview(data);
}

/**
 * Get average rating summary for a product.
 * WooCommerce already provides this on the product itself,
 * but if you need separate aggregation:
 */
export async function getProductRatingSummary(productId) {
  const reviews = await fetchProductReviews(productId);

  if (reviews.length === 0) {
    return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  reviews.forEach((r) => {
    sum += r.rating;
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
  });

  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
    distribution,
  };
}

// ────────────────────────────────────────────────

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}
