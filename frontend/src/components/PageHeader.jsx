import React from "react";
import { Link } from "react-router-dom";
import Title from "./Title";
import brand from "../brand";

/**
 * Compact page intro — used on Shop (NOT full hero carousel)
 */
const PageHeader = ({
  eyebrow = brand.shortName || brand.name,
  title1,
  title2,
  subtitle,
  ctaLabel,
  ctaTo,
  children,
}) => {
  return (
    <section className="relative overflow-hidden border-b border-tz-pink/20 bg-white">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% -10%, rgb(var(--tz-pink) / 0.12), transparent 60%)",
        }}
      />
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 text-center">
        <Title text1={title1} text2={title2} eyebrow={eyebrow} />
        {subtitle && (
          <p className="mt-2 text-sm text-tz-navy/55 max-w-xl mx-auto">{subtitle}</p>
        )}
        {ctaLabel && ctaTo && (
          <Link
            to={ctaTo}
            className="inline-flex mt-4 text-sm font-semibold text-tz-pink hover:text-tz-navy transition-colors"
          >
            {ctaLabel}
          </Link>
        )}
        {children}
      </div>
    </section>
  );
};

export default PageHeader;
