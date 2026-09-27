import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const PromoStrip = () => {
  const { settings } = useContext(ShopContext);

  if (!settings?.promoStrip?.isActive || !settings.promoStrip.message) {
    return null;
  }

  const { message, link } = settings.promoStrip;

  const inner = (
    <span className="inline-flex items-center justify-center gap-2.5 tracking-[0.14em] uppercase font-semibold">
      <span className="text-white">{message}</span>
      {link ? (
        <span className="text-tz-blue font-semibold normal-case tracking-wide text-[11px] sm:text-xs">
          Shop →
        </span>
      ) : null}
    </span>
  );

  return (
    <div className="bg-tz-accent text-white text-[10px] sm:text-[11px] text-center py-2.5 px-4 leading-none border-b border-tz-blue/30"
      style={{ backgroundColor: "rgb(var(--brand-accent-rgb))" }}
    >
      {link ? (
        <Link to={link} className="hover:opacity-90 transition-opacity">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  );
};

export default PromoStrip;
