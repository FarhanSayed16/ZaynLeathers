import React from "react";
import { Link } from "react-router-dom";
import brand from "../brand";

const VibeCTA = () => {
  return (
    <section className="relative my-10 sm:my-14 overflow-hidden">
      <div className="mx-4 sm:mx-6 lg:mx-auto max-w-[1400px] relative min-h-[300px] sm:min-h-[380px] flex items-center overflow-hidden">
        <img
          src={brand.media.heroes?.[3]?.image || "/brand/heroes/banner-4-collection.png"}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-[68%_center]"
          onError={(e) => {
            e.currentTarget.src = brand.media.heroes?.[0]?.image || brand.media.placeholder;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
        <div className="relative z-10 w-full px-6 sm:px-10 py-10 sm:py-12">
          <div className="max-w-lg text-white">
            <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-tz-blue mb-2">
              {brand.shortName}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-snug">
              Jackets. Accessories. Made to last.
            </h2>
            <p className="mt-3 text-white/75 text-sm sm:text-[15px] max-w-md leading-relaxed">
              Real leather apparel and carries — from biker jackets to bags and belts — crafted for everyday wear.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <Link
                to={brand.catalog.primary.path || "/shop?department=men"}
                className="inline-flex justify-center items-center px-7 py-3 bg-tz-pink text-white font-semibold text-sm hover:bg-tz-blue hover:text-tz-navy transition-colors"
              >
                Shop jackets
              </Link>
              <Link
                to={brand.catalog.secondary.path || "/shop?department=accessories"}
                className="inline-flex justify-center items-center px-7 py-3 bg-transparent text-white font-semibold text-sm border border-white/40 hover:border-tz-blue hover:text-tz-blue transition-colors"
              >
                Shop accessories
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VibeCTA;
