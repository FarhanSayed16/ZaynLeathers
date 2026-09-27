import React from "react";
import { Link } from "react-router-dom";
import brand from "../brand";

export default function HeroSlide({
  image,
  title,
  subtitle,
  ctaLabel,
  ctaLink,
  isPriority,
}) {
  return (
    <div className="relative min-w-full h-[72vh] sm:h-[78vh] md:h-[85vh] min-h-[420px] max-h-[920px] flex-shrink-0 snap-start overflow-hidden bg-tz-navy">
      <img
        src={image}
        alt={title || brand.name}
        className="absolute inset-0 w-full h-full object-cover scale-105 animate-hero-zoom"
        loading={isPriority ? "eager" : "lazy"}
        fetchpriority={isPriority ? "high" : "auto"}
        onError={(e) => {
          e.currentTarget.src = brand.media.heroes?.[0]?.image || brand.media.placeholder;
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      <div className="relative z-10 h-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 flex items-end sm:items-center pb-16 sm:pb-0">
        <div className="max-w-xl text-white" data-aos="fade-up">
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-tz-blue mb-3">
            {brand.name}
          </p>
          {title ? (
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.05] tracking-tight">
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className="mt-4 text-sm sm:text-base text-white/80 max-w-md leading-relaxed">
              {subtitle}
            </p>
          ) : null}
          <Link
            to={ctaLink || "/shop"}
            className="inline-flex mt-8 items-center gap-2 bg-tz-pink text-white font-semibold text-sm px-7 py-3 hover:bg-tz-blue hover:text-tz-navy transition-colors"
          >
            {ctaLabel || "Shop the collection"}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
