import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import brand from "../brand";
import * as shopApi from "../api/shopApi";

function Stars({ rating }) {
  const score = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <p className="text-xs tracking-widest text-tz-navy" aria-label={`${score} out of 5`}>
      {"★".repeat(score)}
      <span className="text-tz-navy/25">{"★".repeat(5 - score)}</span>
    </p>
  );
}

const BrandStory = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let cancelled = false;
    shopApi
      .getRecentReviews(3)
      .then((list) => {
        if (!cancelled) setReviews(Array.isArray(list) ? list.filter((item) => item.comment) : []);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-[#f7f4ef] border-y border-tz-navy/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-14 items-start">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-tz-navy/45">
            Since 2015
          </p>
          <h2 className="font-display text-3xl sm:text-5xl text-tz-navy mt-3 leading-tight">
            Crafted in leather.
            <span className="block italic font-medium">Made to last.</span>
          </h2>
          <div className="mt-5 space-y-4 text-sm sm:text-base leading-relaxed text-tz-navy/75 max-w-xl">
            <p>{brand.about?.storyLead}</p>
            <p>{brand.about?.storyBody}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/about"
              className="inline-flex items-center justify-center px-6 py-3 bg-tz-navy text-white text-sm font-semibold"
            >
              Our story
            </Link>
            <Link
              to={brand.catalog?.primary?.path || "/shop?department=men"}
              className="inline-flex items-center justify-center px-6 py-3 border border-tz-navy/30 text-sm font-semibold text-tz-navy"
            >
              Shop jackets
            </Link>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-tz-navy/45 mb-4">
            Customer reviews
          </p>
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <article key={review._id} className="bg-white border border-tz-navy/10 p-4 sm:p-5">
                  <Stars rating={review.rating} />
                  <p className="mt-2 text-sm leading-relaxed text-tz-navy/80 line-clamp-4">
                    {review.comment}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-tz-navy/50">
                    {review.name || "Customer"}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {[
                ["99%", "Positive feedback"],
                ["15K", "Items sold"],
                ["4.3K", "Followers"],
              ].map(([value, label]) => (
                <div key={label} className="bg-white border border-tz-navy/10 p-4 text-center">
                  <p className="font-display text-2xl sm:text-3xl text-tz-navy">{value}</p>
                  <p className="mt-1 text-[11px] leading-snug text-tz-navy/55">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BrandStory;
