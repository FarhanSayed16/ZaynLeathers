import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaShoppingBag } from "react-icons/fa";
import { ShopContext } from "../context/ShopContext";

const FloatingCart = () => {
  const { cartCount, getCartAmount, formatPrice } = useContext(ShopContext);
  const location = useLocation();

  // Hide on cart / checkout / PDP (PDP has sticky ATC)
  if (
    ["/cart", "/place-order"].includes(location.pathname) ||
    location.pathname.startsWith("/product/")
  ) {
    return null;
  }

  const amount = formatPrice ? formatPrice(getCartAmount?.() || 0) : "";

  return (
    <Link
      to="/cart"
      aria-label={`Cart, ${cartCount} items, ${amount}`}
      className="fixed bottom-6 right-4 sm:right-6 z-40 min-w-12 h-12 px-3 rounded-sm bg-white border border-gray-200 shadow-md text-tz-navy flex items-center justify-center gap-2 hover:bg-tz-navy hover:text-white transition-colors"
    >
      <span className="relative inline-flex">
        <FaShoppingBag size={16} />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-tz-navy text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </span>
      {cartCount > 0 && (
        <span className="hidden sm:inline text-xs font-semibold tabular-nums">{amount}</span>
      )}
    </Link>
  );
};

export default FloatingCart;
