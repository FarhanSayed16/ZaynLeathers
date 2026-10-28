import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../../context/ShopContext";
import { highlightQuotes, itemIdFromSku, loadCustomerReviews } from "../../api/customerReviews";

function productPhoto(product) {
  if (!product) return "";
  return Array.isArray(product.image) ? product.image.find(Boolean) || "" : product.image || "";
}

const HomeTalking = () => {
  const { products } = useContext(ShopContext);
  const [quotes, setQuotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [positive, setPositive] = useState("");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadCustomerReviews()
      .then((data) => {
        if (cancelled) return;
        setQuotes(highlightQuotes(data?.reviews, 6));
        setTotal(Number(data?.reviews_count || data?.store_summary?.total_reviews_scraped || 0));
        setPositive(data?.store_summary?.positive_percentage || "99%");
      })
      .catch(() => {
        if (!cancelled) setQuotes([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener?.("change", apply);
    return () => media.removeEventListener?.("change", apply);
  }, []);

  const byItem = useMemo(() => {
    const map = new Map();
    for (const product of products || []) {
      const itemId = itemIdFromSku(product.sku);
      if (itemId && !map.has(itemId)) map.set(itemId, product);
    }
    return map;
  }, [products]);

  const count = Math.max(quotes.length, 1);
  const current = quotes[index] || {
    rating: 5,
    comment: "15,000 pieces sold and 99% positive feedback. Jackets are checked before they leave.",
    name: "Zayn Leathers customers",
  };
  const product = current.itemId ? byItem.get(current.itemId) : null;
  const photo = productPhoto(product);

  useEffect(() => {
    if (paused || reduceMotion || quotes.length < 2) return undefined;
    const timer = setInterval(() => {
      setIndex((value) => (value + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [paused, reduceMotion, quotes.length]);

  const step = (dir) => setIndex((value) => (value + dir + count) % count);

  return (
    <section
      className="bg-[#f7f4ef] border-t border-black/5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 text-center">
        <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-tz-navy/45">
          People are talking
        </p>
        {total ? (
          <p className="mt-1 text-sm text-tz-navy/60">
            {total.toLocaleString()} verified reviews · {positive} positive
          </p>
        ) : null}

        <div
          key={current._id || index}
          className={`animate-quote-in mt-4 sm:mt-5 flex flex-col items-center gap-4 text-center ${
            photo ? "sm:flex-row sm:items-center sm:text-left sm:gap-6" : ""
          }`}
        >
          {photo ? (
            <Link to={`/product/${product._id}`} className="shrink-0" aria-label={product.name}>
              <img src={photo} alt="" className="h-24 w-16 sm:h-32 sm:w-24 object-contain bg-white" />
            </Link>
          ) : null}
          <div className="min-w-0 w-full max-w-xl">
            <p className="text-amber-500 tracking-[0.22em] text-sm" aria-label={`${current.rating || 5} out of 5`}>
              {"★".repeat(current.rating || 5)}
              <span className="text-tz-navy/15">{"★".repeat(Math.max(0, 5 - (current.rating || 5)))}</span>
            </p>
            <blockquote className="mt-2 font-display text-[15px] sm:text-xl leading-relaxed sm:leading-snug text-tz-navy line-clamp-5 sm:line-clamp-3 text-pretty">
              “{current.comment}”
            </blockquote>
            <p className="mt-2 text-sm text-tz-navy/55">— {current.name || "Verified buyer"}</p>
            {product ? (
              <Link
                to={`/product/${product._id}`}
                className="mt-1 inline-block max-w-full text-sm font-semibold text-tz-navy underline underline-offset-4 line-clamp-2 sm:line-clamp-1"
              >
                {product.name}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-4 sm:mt-5 flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-3">
            {quotes.length > 1 ? (
              <button
                type="button"
                onClick={() => step(-1)}
                className="h-10 w-10 border border-tz-navy/20 text-lg leading-none"
                aria-label="Previous review"
              >
                ‹
              </button>
            ) : null}
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Reviews">
              {quotes.map((quote, dot) => (
                <button
                  key={quote._id || dot}
                  type="button"
                  role="tab"
                  aria-selected={dot === index}
                  aria-label={`Review ${dot + 1} of ${quotes.length}`}
                  onClick={() => setIndex(dot)}
                  className="relative h-8 w-4 flex items-center justify-center"
                >
                  <span className={`relative block h-1.5 overflow-hidden ${dot === index ? "w-6 bg-tz-navy/20" : "w-1.5 bg-tz-navy/25"}`}>
                    {dot === index && !paused && !reduceMotion ? (
                      <span key={`${quote._id || dot}-${index}`} className="absolute inset-0 bg-tz-navy animate-review-dot" />
                    ) : null}
                    {dot === index && (paused || reduceMotion) ? <span className="absolute inset-0 bg-tz-navy" /> : null}
                  </span>
                </button>
              ))}
            </div>
            {quotes.length > 1 ? (
              <button
                type="button"
                onClick={() => step(1)}
                className="h-10 w-10 border border-tz-navy/20 text-lg leading-none"
                aria-label="Next review"
              >
                ›
              </button>
            ) : null}
          </div>
          <Link to="/reviews" className="text-sm font-semibold text-tz-navy underline underline-offset-4">
            All reviews
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeTalking;
