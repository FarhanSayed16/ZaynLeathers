const URL = "/reviews/zaynleather_reviews.json";

let pending = null;

export function loadCustomerReviews() {
  if (!pending) {
    pending = fetch(URL)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load reviews");
        return response.json();
      })
      .catch((error) => {
        pending = null;
        throw error;
      });
  }
  return pending;
}

export function mapCustomerReview(review) {
  return {
    _id: `feedback-${review.feedback_id || review.id}`,
    name: "Verified buyer",
    comment: String(review.review_text || "").trim(),
    rating: Number(review.stars) || 5,
    sentiment: review.rating || "Positive",
    timeframe: review.timeframe || "",
    itemId: String(review.item_id || ""),
    verified: Boolean(review.verified_purchase),
  };
}

export function itemIdFromSku(sku) {
  const match = String(sku || "").match(/^ZL-(\d+)/i);
  return match ? match[1] : "";
}

export function reviewsForItem(reviews, itemId) {
  if (!itemId) return [];
  return (reviews || [])
    .filter((review) => String(review.item_id || "") === String(itemId) && review.review_text)
    .map(mapCustomerReview);
}

/** A short set of distinct quotes for the homepage. The full list stays on /reviews. */
export function highlightQuotes(reviews, limit = 6) {
  const seen = new Set();
  const quotes = [];
  for (const review of reviews || []) {
    const text = String(review.review_text || "").trim();
    if (text.length < 90 || text.length > 380) continue;
    if ((Number(review.stars) || 0) < 5) continue;
    const key = text.slice(0, 80).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    quotes.push(mapCustomerReview(review));
    if (quotes.length >= limit) break;
  }
  return quotes;
}
