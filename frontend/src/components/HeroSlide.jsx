import React from "react";
import { Link } from "react-router-dom";
import brand from "../brand";

/**
 * Phase B hero typography — brand + serif headline + italic highlight (reference “NEW Arrival”).
 */
export default function HeroSlide({
  image,
  title,
  highlight,
  subtitle,
  ctaLabel,
  ctaLink,
  isPriority,
}) {
  const displayTitle = title || brand.about?.heroTitle || brand.tagline;
  const displayHighlight =
    highlight || (title ? "" : brand.about?.heroHighlight || "");

  return (
    <div className="relative min-w-full h-[70vh] sm:h-[78vh] md:h-[85vh] min-h-[440px] max-h-[640px] sm:max-h-[920px] flex-shrink-0 snap-start overflow-hidden bg-tz-navy">
      <img
        src={image}
        alt={displayTitle || brand.name}
        className={`absolute inset-0 w-full h-full object-cover scale-105 animate-hero-zoom ${
          String(image).includes("banner-4")
            ? "object-center"
            : String(image).includes("banner-2")
              ? "object-[78%_center]"
              : "object-[72%_center] sm:object-right"
        }`}
        loading={isPriority ? "eager" : "lazy"}
        fetchpriority={isPriority ? "high" : "auto"}
        onError={(e) => {
          e.currentTarget.src = brand.media.heroes?.[0]?.image || brand.media.placeholder;
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/25 sm:hidden" />
      <div className="absolute inset-0 hidden sm:block bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
      <div className="absolute inset-0 hidden sm:block bg-gradient-to-t from-black/45 via-transparent to-transparent" />

      <div className="relative z-10 h-full max-w-[1400px] mx-auto px-5 sm:px-10 lg:px-16 flex items-end justify-center sm:items-center sm:justify-start pb-10 sm:pb-0">
        <div className="max-w-xl text-white w-full text-center sm:text-left" data-aos="fade-up">
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/70 mb-3 sm:mb-4">
            {brand.name}
          </p>
          <h1 className="font-display text-[1.85rem] sm:text-5xl md:text-6xl xl:text-7xl font-semibold leading-[1.05] tracking-tight">
            <span className="text-[#E8D5B5]">{displayTitle}</span>
            {displayHighlight ? (
              <>
                <br />
                <span className="italic font-medium text-white/95 text-[0.85em]">
                  {displayHighlight}
                </span>
              </>
            ) : null}
          </h1>
          {subtitle ? (
            <p className="mt-4 text-sm sm:text-base text-white/75 max-w-md leading-relaxed mx-auto sm:mx-0">
              {subtitle}
            </p>
          ) : (
            <p className="mt-4 text-sm sm:text-base text-white/75 max-w-md leading-relaxed mx-auto sm:mx-0">
              {brand.about?.heroSubtitle || brand.tagline}
            </p>
          )}
          <Link
            to={ctaLink || "/shop?sort=newest"}
            className="inline-flex mt-6 sm:mt-8 items-center gap-2 bg-white text-tz-navy font-semibold text-sm px-8 py-3.5 hover:bg-tz-pink hover:text-white transition-colors"
          >
            {ctaLabel || "Shop new arrivals"}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
