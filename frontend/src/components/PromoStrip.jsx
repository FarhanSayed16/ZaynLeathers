import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import brand from "../brand";

const WRONG_BRAND = /afiya|afhiya/i;

/**
 * Slim always-visible promo bar.
 * Prefers live settings; rejects Afiya/Afhiya copy on Zayn storefront.
 */
const PromoStrip = () => {
  const { settings } = useContext(ShopContext);

  const fallback = brand.catalog?.promoFallback
    ? { message: brand.catalog.promoFallback, link: "/shop" }
    : null;

  let fromSettings = null;
  if (settings?.promoStrip?.isActive && settings.promoStrip.message) {
    const msg = String(settings.promoStrip.message);
    if (!WRONG_BRAND.test(msg)) {
      fromSettings = {
        message: msg,
        link: settings.promoStrip.link || "/shop",
      };
    }
  }

  const promo = fromSettings || fallback;
  if (!promo?.message) return null;

  const inner = (
    <span className="inline-flex items-center justify-center gap-2 tracking-[0.1em] uppercase font-semibold">
      <span>{promo.message}</span>
      {promo.link ? (
        <span className="hidden sm:inline normal-case tracking-wide font-medium opacity-90">
          Shop now →
        </span>
      ) : null}
    </span>
  );

  return (
    <div className="bg-tz-navy text-white text-[10px] sm:text-[11px] text-center py-1.5 sm:py-2 px-4 leading-none">
      {promo.link ? (
        <Link to={promo.link} className="hover:opacity-90 transition-opacity">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  );
};

export default PromoStrip;
