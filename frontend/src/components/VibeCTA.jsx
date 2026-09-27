import React from "react";
import { Link } from "react-router-dom";
import brand from "../brand";

const VibeCTA = () => {
  return (
    <section className="relative my-10 sm:my-14 overflow-hidden">
      <div className="mx-4 sm:mx-6 lg:mx-auto max-w-[1400px] relative min-h-[280px] sm:min-h-[320px] flex items-center">
        <img
          src="/brand/lifestyle/leather-blazer.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = brand.media.heroes?.[0]?.image || brand.media.placeholder;
          }}
        />
        <div className="absolute inset-0 bg-tz-navy/75" />
        <div className="relative z-10 w-full px-6 sm:px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left max-w-lg text-white">
            <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-tz-blue mb-2">
              {brand.shortName}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-snug">
              Jackets. Bags. Made to last.
            </h2>
            <p className="mt-3 text-white/70 text-sm sm:text-[15px] max-w-md leading-relaxed">
              Real leather apparel and carries — from biker jackets to office bags — crafted for everyday wear.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <Link
              to={brand.catalog.primary.path || "/shop?department=men"}
              className="inline-flex justify-center items-center px-7 py-3 bg-tz-pink text-white font-semibold text-sm hover:bg-tz-blue hover:text-tz-navy transition-colors"
            >
              Shop jackets
            </Link>
            <Link
              to={brand.catalog.secondary.path || "/shop?department=bags"}
              className="inline-flex justify-center items-center px-7 py-3 bg-transparent text-white font-semibold text-sm border border-white/40 hover:border-tz-blue hover:text-tz-blue transition-colors"
            >
              Shop bags
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VibeCTA;
