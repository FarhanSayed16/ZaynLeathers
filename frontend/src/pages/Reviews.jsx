import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import Breadcrumbs from "../components/Breadcrumbs";
import { ShopContext } from "../context/ShopContext";
import { itemIdFromSku, loadCustomerReviews, mapCustomerReview } from "../api/customerReviews";

const PAGE_SIZE = 12;
const PREVIEW = 280;

function Stars({ value }) {
  const score = Number(value) || 0;
  return (
    <span className="text-amber-500 tracking-wider" aria-label={`${score} out of 5`}>
      {"★".repeat(score)}
      <span className="text-tz-navy/20">{"★".repeat(Math.max(0, 5 - score))}</span>
    </span>
  );
}

function productPhoto(product) {
  if (!product) return "";
  return Array.isArray(product.image) ? product.image.find(Boolean) || "" : product.image || "";
}

function ReviewCard({ review, product }) {
  const [open, setOpen] = useState(false);
  const long = review.comment.length > PREVIEW;
  const text = long && !open ? `${review.comment.slice(0, PREVIEW).trim()}…` : review.comment;
  const photo = productPhoto(product);

  return (
    <article className="flex flex-col border border-tz-navy/10 bg-white p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars value={review.rating} />
        {review.sentiment && review.sentiment !== "Positive" ? (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-tz-navy/50">
            {review.sentiment}
          </span>
        ) : null}
        {review.timeframe ? <span className="ml-auto text-xs text-tz-navy/40">{review.timeframe}</span> : null}
      </div>
      <p className="mt-3 text-sm font-semibold text-tz-navy">
        {review.name}
        {review.verified ? <span className="ml-2 font-normal text-xs uppercase tracking-wide text-tz-navy/40">Verified purchase</span> : null}
      </p>
      <p className="mt-2 text-tz-navy/80 leading-relaxed">{text}</p>
      {long ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="mt-2 self-start text-sm font-semibold text-tz-navy underline underline-offset-4"
        >
          {open ? "Show less" : "Read more"}
        </button>
      ) : null}
      {product ? (
        <Link to={`/product/${product._id}`} className="mt-4 flex items-center gap-3 border-t border-tz-navy/10 pt-4">
          {photo ? <img src={photo} alt="" className="h-14 w-11 object-cover bg-[#f7f4ef] shrink-0" /> : null}
          <span className="text-sm font-semibold text-tz-navy line-clamp-2">{product.name}</span>
        </Link>
      ) : null}
    </article>
  );
}

const Reviews = () => {
  const { products } = useContext(ShopContext);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    loadCustomerReviews()
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setError("Reviews could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = data?.store_summary;
  const ratings = summary?.detailed_seller_ratings || {};
  const year = summary?.feedback_counts_12_months || {};

  const byItem = useMemo(() => {
    const map = new Map();
    for (const product of products || []) {
      const itemId = itemIdFromSku(product.sku);
      if (itemId && !map.has(itemId)) map.set(itemId, product);
    }
    return map;
  }, [products]);

  const allReviews = useMemo(
    () => (data?.reviews || []).map(mapCustomerReview).filter((review) => review.comment),
    [data]
  );

  const searched = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return allReviews;
    return allReviews.filter((review) => review.comment.toLowerCase().includes(needle));
  }, [allReviews, query]);

  const counts = useMemo(() => {
    const tally = { All: searched.length, Positive: 0, Neutral: 0, Negative: 0 };
    for (const review of searched) {
      if (tally[review.sentiment] != null) tally[review.sentiment] += 1;
    }
    return tally;
  }, [searched]);

  const reviews = filter === "All" ? searched : searched.filter((review) => review.sentiment === filter);

  useEffect(() => {
    setShown(PAGE_SIZE);
  }, [filter, query]);

  const visible = reviews.slice(0, shown);

  return (
    <div className="bg-white">
      <SEO
        title="Customer reviews"
        description="1,125 verified customer reviews for Zayn Leathers. 99% positive feedback."
      />
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Reviews" }]} />
        <p className="mt-6 text-[11px] font-semibold tracking-[0.22em] uppercase text-tz-navy/45">
          Verified purchases
        </p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl text-tz-navy">Customer reviews</h1>
        <p className="mt-4 max-w-2xl text-tz-navy/70">
          Feedback from customers who bought Zayn Leathers pieces. Names are kept private.
          New reviews left on this website are added on the product page.
        </p>

        {summary ? (
          <>
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                [summary.total_reviews_scraped?.toLocaleString?.() || summary.total_reviews_scraped, "Customer reviews"],
                [summary.positive_percentage, "Positive feedback"],
                [summary.items_sold, "Pieces sold"],
                [summary.followers, "Followers"],
              ].map(([value, label]) => (
                <div key={label} className="border border-tz-navy/10 bg-[#f7f4ef] px-4 py-5">
                  <p className="font-display text-3xl text-tz-navy">{value}</p>
                  <p className="mt-1 text-xs tracking-wide uppercase text-tz-navy/50">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ["Accurate description", ratings.accurate_description],
                ["Shipping speed", ratings.shipping_speed],
                ["Shipping cost", ratings.reasonable_shipping_cost],
                ["Communication", ratings.communication],
              ].map(([label, score]) => (
                <div key={label} className="border border-tz-navy/10 px-4 py-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm text-tz-navy">{label}</p>
                    <p className="font-semibold text-tz-navy">{Number(score).toFixed(1)}</p>
                  </div>
                  <div className="mt-2 h-1 bg-tz-navy/10">
                    <div className="h-full bg-tz-navy" style={{ width: `${Math.min(100, (Number(score) / 5) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-tz-navy/60">
              Past 12 months: {year.positive?.toLocaleString?.() || year.positive} positive
              {" · "}
              {year.neutral} neutral
              {" · "}
              {year.negative} negative
            </p>
          </>
        ) : null}

        {error ? <p className="mt-8 text-sm text-red-700">{error}</p> : null}

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="sr-only" htmlFor="review-search">Search reviews</label>
          <input
            id="review-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search reviews"
            className="w-full sm:max-w-xs border border-tz-navy/15 px-3 py-2 text-sm text-tz-navy placeholder:text-tz-navy/40"
          />
          <div className="flex flex-wrap gap-2">
            {["All", "Positive", "Neutral", "Negative"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`px-4 py-2 text-sm border ${
                  filter === option
                    ? "bg-tz-navy text-white border-tz-navy"
                    : "border-tz-navy/15 text-tz-navy"
                }`}
              >
                {option}
                {data ? <span className="ml-1.5 opacity-70">{counts[option].toLocaleString()}</span> : null}
              </button>
            ))}
          </div>
        </div>

        {!data && !error ? (
          <div className="mt-6 grid lg:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((slot) => (
              <div key={slot} className="h-40 border border-tz-navy/10 bg-[#f7f4ef] animate-pulse" />
            ))}
          </div>
        ) : null}

        {data && visible.length === 0 ? (
          <p className="mt-8 text-sm text-tz-navy/60">No reviews match that search.</p>
        ) : null}

        <div className="mt-6 grid lg:grid-cols-2 gap-4">
          {visible.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              product={review.itemId ? byItem.get(review.itemId) : null}
            />
          ))}
        </div>

        {shown < reviews.length ? (
          <button
            type="button"
            onClick={() => setShown((count) => count + PAGE_SIZE)}
            className="mt-6 border border-tz-navy px-5 py-2.5 text-sm font-semibold text-tz-navy"
          >
            Show more ({(reviews.length - shown).toLocaleString()} left)
          </button>
        ) : null}

        <p className="mt-10 text-sm text-tz-navy/60">
          Looking for a jacket? <Link to="/shop" className="font-semibold underline underline-offset-4">Shop the collection</Link>
        </p>
      </div>
    </div>
  );
};

export default Reviews;
