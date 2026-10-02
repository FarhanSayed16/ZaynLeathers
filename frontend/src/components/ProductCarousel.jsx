import React, { useRef, useState, useEffect, useCallback } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ProductItem from "./ProductItem";
import { Link } from "react-router-dom";

/**
 * Horizontal product carousel with large chevron arrows (Phase B).
 */
const ProductCarousel = ({
  title,
  subtitle,
  products = [],
  viewAllHref,
  emptyText = "No products yet",
}) => {
  const scrollerRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < max - 8);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [products, updateArrows]);

  const scrollByPage = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.75, 280);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  // Split title for serif display like reference (“Best Selling Products”)
  const heading = title || "";

  return (
    <section className="relative w-full py-10 sm:py-14 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="font-display text-2xl sm:text-3xl md:text-[2.15rem] font-semibold text-tz-navy tracking-tight">
            {heading}
          </h2>
          {subtitle ? (
            <p className="mt-2 text-sm text-tz-navy/50">{subtitle}</p>
          ) : null}
          {viewAllHref ? (
            <Link
              to={viewAllHref}
              className="inline-block mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-tz-navy/60 hover:text-tz-navy underline-offset-4 hover:underline"
            >
              View all →
            </Link>
          ) : null}
        </div>

        {!products.length ? (
          <p className="text-center text-sm text-tz-navy/40 py-12">{emptyText}</p>
        ) : (
          <div className="relative">
            {/* Prev */}
            <button
              type="button"
              aria-label="Previous products"
              disabled={!canPrev}
              onClick={() => scrollByPage(-1)}
              className={`hidden md:flex absolute -left-1 lg:-left-3 top-1/2 -translate-y-[60%] z-20 w-11 h-11 items-center justify-center text-tz-navy transition-opacity ${
                canPrev ? "opacity-90 hover:opacity-100" : "opacity-20 cursor-default"
              }`}
            >
              <FaChevronLeft size={28} strokeWidth={1} />
            </button>

            <div
              ref={scrollerRef}
              className="flex gap-3 sm:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 scrollbar-hide"
            >
              {products.map((item) => (
                <div
                  key={item._id}
                  className="snap-start shrink-0 w-[42%] xs:w-[38%] sm:w-[30%] md:w-[23%] lg:w-[22%] max-w-[280px]"
                >
                  <ProductItem
                    id={item._id}
                    image={item.image}
                    name={item.name}
                    price={item.price}
                    discount={item.discount}
                    oldPrice={item.oldPrice}
                    availableQuantity={item.availableQuantity}
                    imageAlt={item.imageAlt}
                    priceFrom={item.priceFrom}
                  />
                </div>
              ))}
            </div>

            {/* Next */}
            <button
              type="button"
              aria-label="Next products"
              disabled={!canNext}
              onClick={() => scrollByPage(1)}
              className={`hidden md:flex absolute -right-1 lg:-right-3 top-1/2 -translate-y-[60%] z-20 w-11 h-11 items-center justify-center text-tz-navy transition-opacity ${
                canNext ? "opacity-90 hover:opacity-100" : "opacity-20 cursor-default"
              }`}
            >
              <FaChevronRight size={28} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductCarousel;
