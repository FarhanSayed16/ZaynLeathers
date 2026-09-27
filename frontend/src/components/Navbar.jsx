import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaHeart,
  FaUser,
  FaBars,
  FaTimes,
  FaSearch,
  FaThLarge,
} from "react-icons/fa";
import brand from "../brand";
import CurrencySelector from "./CurrencySelector";

const FALLBACK_NAV = [
  { name: "Home", label: "Home", path: "/" },
  { name: "Shop", label: "Shop", path: "/shop" },
  { name: "Men", label: "Men", path: "/shop" },
  { name: "Women", label: "Women", path: "/shop" },
  { name: "Bags", label: "Bags", path: "/shop" },
  { name: "About", label: "About", path: "/about" },
  { name: "Contact", label: "Contact", path: "/contact" },
];

function parseLink(path) {
  const [pathname, query = ""] = String(path || "/").split("?");
  return { pathname, params: new URLSearchParams(query) };
}

function isNavActive(linkPath, location) {
  const { pathname, params } = parseLink(linkPath);
  if (location.pathname !== pathname) return false;

  const linkDept = params.get("department");
  const linkCat = params.get("category");
  const locParams = new URLSearchParams(location.search);
  const locDept = locParams.get("department");
  const locCat = locParams.get("category");

  if (pathname === "/shop") {
    if (linkDept) return locDept === linkDept && (!linkCat || locCat === linkCat);
    if (linkCat) return locCat === linkCat;
    return !locDept && !locCat;
  }
  return true;
}

const Navbar = () => {
  const [visible, setVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredProfile, setHoveredProfile] = useState(false);
  const location = useLocation();

  const {
    setShowSearch,
    cartCount,
    navigate,
    token,
    user,
    logout: signOutUser,
    wishlistItems,
    categoryTree,
  } = useContext(ShopContext);

  const [shopOpen, setShopOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);

  const departments = useMemo(() => {
    if (categoryTree?.length) return categoryTree.filter((d) => d.type === "department");
    return [];
  }, [categoryTree]);

  const navLinks = useMemo(() => {
    const raw = brand.catalog?.nav?.length ? brand.catalog.nav : FALLBACK_NAV;
    return raw.map((link) => ({
      ...link,
      label: link.label || link.name || "Link",
    }));
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  const signOut = () => {
    signOutUser({ silent: true });
    navigate("/");
  };

  const iconBtn =
    "inline-flex items-center justify-center w-9 h-9 rounded-sm text-tz-navy/75 hover:text-tz-navy hover:bg-gray-100 transition-colors";

  const linkClass = (active) =>
    `relative px-3.5 py-2 text-[13px] font-semibold tracking-wide transition-colors ${
      active
        ? "text-tz-navy"
        : "text-tz-navy hover:text-tz-navy hover:bg-gray-100"
    }`;

  const CartBadge = () =>
    cartCount > 0 ? (
      <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-1 rounded-sm bg-tz-navy text-white text-[9px] font-bold flex items-center justify-center">
        {cartCount}
      </span>
    ) : null;

  return (
    <>
      <header
        className={`w-full border-b transition-all duration-300 ${
          scrolled
            ? "bg-white/98 backdrop-blur-md border-tz-pink/20 shadow-nav"
            : "bg-white border-tz-pink/10"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden lg:flex items-center justify-between h-[68px]">
            <Link to="/" className="shrink-0 flex items-center gap-2.5">
              <span className="font-display font-semibold text-2xl tracking-wide text-tz-navy py-2">
                {brand.name}
              </span>
            </Link>

            <nav className="flex items-center gap-0.5">
              {navLinks.map((link) => {
                const isShop = link.path === "/shop" || link.label === "Shop";
                const active = isNavActive(link.path, location);

                if (isShop && departments.length > 0) {
                  return (
                    <div
                      key={link.path + "-mega"}
                      className="relative"
                      onMouseEnter={() => setShopOpen(true)}
                      onMouseLeave={() => setShopOpen(false)}
                    >
                      <NavLink to="/shop" className={linkClass(active || shopOpen)} end>
                        Shop
                        {(active || shopOpen) && (
                          <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-tz-navy rounded-none" />
                        )}
                      </NavLink>
                      <AnimatePresence>
                        {shopOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50"
                          >
                            <div className="w-[min(920px,90vw)] bg-white rounded-none shadow-xl border-t-2 border-t-tz-navy border-x border-b border-gray-200 p-6 grid grid-cols-4 gap-4">
                              {departments.slice(0, 8).map((dept) => (
                                <div key={dept._id}>
                                  <Link
                                    to={`/shop?department=${dept.slug}`}
                                    className="font-semibold text-sm text-tz-navy hover:text-tz-pink"
                                    onClick={() => setShopOpen(false)}
                                  >
                                    {dept.name}
                                  </Link>
                                  <ul className="mt-2 space-y-1">
                                    {(dept.children || []).slice(0, 8).map((child) => (
                                      <li key={child._id}>
                                        <Link
                                          to={
                                            child.type === "group"
                                              ? `/shop?department=${dept.slug}`
                                              : `/shop?department=${dept.slug}&category=${child.slug}`
                                          }
                                          className="text-xs text-tz-navy/60 hover:text-tz-pink block truncate"
                                          onClick={() => setShopOpen(false)}
                                        >
                                          {child.name}
                                        </Link>
                                        {child.type === "group" &&
                                          (child.children || []).slice(0, 4).map((leaf) => (
                                            <Link
                                              key={leaf._id}
                                              to={`/shop?department=${dept.slug}&category=${leaf.slug}`}
                                              className="text-[11px] text-tz-navy/45 hover:text-tz-pink block truncate pl-2"
                                              onClick={() => setShopOpen(false)}
                                            >
                                              {leaf.name}
                                            </Link>
                                          ))}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={link.path + link.label}
                    to={link.path}
                    className={linkClass(active)}
                    end={link.path === "/" || link.path === "/shop"}
                  >
                    {link.label}
                    {active ? (
                      <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-tz-navy rounded-none" />
                    ) : null}
                  </NavLink>
                );
              })}
            </nav>

            <div className="flex items-center gap-0.5">
              <CurrencySelector />
              <button
                type="button"
                aria-label="Search"
                onClick={() => setShowSearch(true)}
                className={iconBtn}
              >
                <FaSearch size={14} />
              </button>

              <Link to="/wishlist" className={`${iconBtn} relative`} aria-label="Wishlist">
                <FaHeart size={14} />
                {wishlistItems?.length > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-1 rounded-sm bg-tz-navy text-white text-[9px] font-bold flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              <div
                className="relative"
                onMouseEnter={() => setHoveredProfile(true)}
                onMouseLeave={() => setHoveredProfile(false)}
              >
                <button
                  type="button"
                  aria-label="Account"
                  className={iconBtn}
                  onClick={() => {
                    if (!token) navigate("/login");
                    else navigate("/account");
                  }}
                >
                  <FaUser size={14} />
                </button>
                {token && user?.firstName && (
                  <span className="sr-only">{user.firstName}</span>
                )}
                <AnimatePresence>
                  {hoveredProfile && token && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute right-0 top-full mt-1 w-40 bg-white rounded-none shadow-xl border-t-2 border-t-tz-navy border-x border-b border-gray-200 overflow-hidden z-50"
                    >
                      <button
                        type="button"
                        onClick={() => navigate("/account")}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-tz-pink/15"
                      >
                        Account
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/orders")}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-tz-pink/15"
                      >
                        Orders
                      </button>
                      <button
                        type="button"
                        onClick={signOut}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-tz-pink/15 text-tz-cherry"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link to="/cart" className={`${iconBtn} relative`} aria-label="Cart">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
                  <path d="M7 4h-2l-1 2H1v2h2l3.6 7.59-1.35 2.44A1 1 0 0 0 6 20h12v-2H7.42a.25.25 0 0 1-.22-.37L8.1 15h7.45a1 1 0 0 0 .92-.62L19 7H6.21l-.94-2zM8 21a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
                </svg>
                <CartBadge />
              </Link>
            </div>
          </div>

          <div className="lg:hidden flex items-center justify-between h-14">
            <button type="button" aria-label="Open menu" onClick={() => setVisible(true)} className={iconBtn}>
              <FaBars size={15} />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <span className="font-display font-semibold text-xl tracking-wide text-tz-navy py-1">
                {brand.name}
              </span>
            </Link>
            <div className="flex items-center">
              <button type="button" aria-label="Search" onClick={() => setShowSearch(true)} className={iconBtn}>
                <FaSearch size={14} />
              </button>
              <button
                type="button"
                aria-label="Account"
                className={iconBtn}
                onClick={() => navigate(token ? "/account" : "/login")}
              >
                <FaUser size={14} />
              </button>
              <Link to="/cart" className={`${iconBtn} relative`} aria-label="Cart">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                  <path d="M7 4h-2l-1 2H1v2h2l3.6 7.59-1.35 2.44A1 1 0 0 0 6 20h12v-2H7.42a.25.25 0 0 1-.22-.37L8.1 15h7.45a1 1 0 0 0 .92-.62L19 7H6.21l-.94-2zM8 21a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
                </svg>
                <CartBadge />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {visible && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-tz-navy/40 z-[60] lg:hidden"
              onClick={() => setVisible(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed top-0 left-0 h-full w-[78%] max-w-xs bg-white z-[70] lg:hidden shadow-xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 h-14 border-b border-tz-pink/15">
                <span className="font-display font-semibold text-tz-navy">{brand.name}</span>
                <button type="button" aria-label="Close menu" onClick={() => setVisible(false)} className={iconBtn}>
                  <FaTimes size={15} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-3 px-3">
                {navLinks.map((link) => {
                  const isShop = link.path === "/shop" || link.label === "Shop";
                  const active = isNavActive(link.path, location);

                  if (isShop && departments.length > 0) {
                    return (
                      <div key="mobile-shop" className="mb-1">
                        <button
                          type="button"
                          onClick={() => setMobileShopOpen((v) => !v)}
                          className={`w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 text-sm font-semibold ${
                            active || mobileShopOpen ? "bg-gray-50 text-tz-navy" : "text-tz-navy/80"
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <FaThLarge size={12} className="opacity-50" />
                            Shop
                          </span>
                          <span className="text-xs opacity-60">{mobileShopOpen ? "−" : "+"}</span>
                        </button>
                        {mobileShopOpen && (
                          <div className="ml-4 pl-4 border-l border-gray-200 space-y-1 pb-3">
                            <Link
                              to="/shop"
                              onClick={() => setVisible(false)}
                              className="block px-2 py-2 text-sm font-medium text-tz-navy hover:text-gray-600"
                            >
                              All products
                            </Link>
                            {departments.map((dept) => (
                              <div key={dept._id} className="pt-2">
                                <Link
                                  to={`/shop?department=${dept.slug}`}
                                  onClick={() => setVisible(false)}
                                  className="block px-2 py-1.5 text-sm font-semibold text-tz-navy"
                                >
                                  {dept.name}
                                </Link>
                                <div className="pl-2">
                                  {(dept.children || []).slice(0, 6).map((child) => (
                                    <Link
                                      key={child._id}
                                      to={
                                        child.type === "group"
                                          ? `/shop?department=${dept.slug}`
                                          : `/shop?department=${dept.slug}&category=${child.slug}`
                                      }
                                      onClick={() => setVisible(false)}
                                      className="block px-2 py-1 text-xs text-tz-navy/60 hover:text-tz-navy"
                                    >
                                      {child.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={link.path + link.label}
                      to={link.path}
                      onClick={() => setVisible(false)}
                      className={`flex items-center gap-2 px-4 py-3 border-b border-gray-100 text-sm font-semibold ${
                        active ? "bg-gray-50 text-tz-navy" : "text-tz-navy/80"
                      }`}
                    >
                      <FaThLarge size={12} className="opacity-50" />
                      {link.label}
                    </NavLink>
                  );
                })}
                <Link
                  to="/wishlist"
                  onClick={() => setVisible(false)}
                  className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 text-sm font-semibold text-tz-navy/80 hover:bg-gray-50"
                >
                  <FaHeart size={12} className="opacity-50" />
                  Wishlist
                </Link>
                {token ? (
                  <>
                    <Link
                      to="/account"
                      onClick={() => setVisible(false)}
                      className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 text-sm font-semibold text-tz-navy/80 hover:bg-gray-50"
                    >
                      <FaUser size={12} className="opacity-50" />
                      {user?.firstName ? `Hi, ${user.firstName}` : "Account"}
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setVisible(false)}
                      className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 text-sm font-semibold text-tz-navy/80 hover:bg-gray-50"
                    >
                      Orders
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        setVisible(false);
                      }}
                      className="w-full text-left px-4 py-3 border-b border-gray-100 text-sm font-semibold text-tz-navy hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setVisible(false)}
                    className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 text-sm font-semibold text-tz-navy/80 hover:bg-gray-50"
                  >
                    <FaUser size={12} className="opacity-50" />
                    Login
                  </Link>
                )}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
