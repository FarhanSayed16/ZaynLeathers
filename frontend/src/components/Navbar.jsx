import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaHeart,
  FaUser,
  FaBars,
  FaTimes,
  FaSearch,
  FaChevronDown,
} from "react-icons/fa";
import brand from "../brand";
import CurrencySelector from "./CurrencySelector";
import MegaMenu, { buildMegaColumns } from "./MegaMenu";

const FALLBACK_NAV = [
  { name: "Men", label: "Men", path: "/shop?department=men", mega: "men" },
  { name: "New Arrivals", label: "New Arrivals", path: "/shop?sort=newest" },
  { name: "Women", label: "Women", path: "/shop?department=women", mega: "women" },
  { name: "Custom Leather Jackets", label: "Custom Leather Jackets", path: "/custom-jackets", highlight: true },
  { name: "Contact", label: "Contact Us", path: "/contact" },
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
  const linkSort = params.get("sort");
  const locParams = new URLSearchParams(location.search);
  const locDept = locParams.get("department");
  const locCat = locParams.get("category");
  const locSort = locParams.get("sort");

  if (pathname === "/shop") {
    if (linkSort) return locSort === linkSort;
    if (linkDept) return locDept === linkDept && (!linkCat || locCat === linkCat);
    if (linkCat) return locCat === linkCat;
    return !locDept && !locCat && !locSort;
  }
  return true;
}

/** Logo SVG already includes brand text — never render both. */
function BrandMark({ className = "h-8", compact = false }) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = brand.logos?.navbar;

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={brand.name}
        className={`${className} w-auto object-contain shrink-0 ${compact ? "h-7" : ""}`}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <span
      className={`font-display font-semibold tracking-wide text-tz-navy truncate ${
        compact ? "text-lg" : "text-xl"
      }`}
    >
      {brand.name}
    </span>
  );
}

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredProfile, setHoveredProfile] = useState(false);
  const [openMega, setOpenMega] = useState(null);
  const [megaViaKeyboard, setMegaViaKeyboard] = useState(false);
  const [mobileMega, setMobileMega] = useState(null);
  const megaCloseTimer = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    setShowSearch,
    cartCount,
    getCartAmount,
    formatPrice,
    token,
    logout: signOutUser,
    wishlistItems,
    categoryTree,
  } = useContext(ShopContext);

  const departments = useMemo(() => {
    if (!categoryTree?.length) return [];
    const typed = categoryTree.filter((d) => d.type === "department");
    if (typed.length) return typed;
    return categoryTree.filter((d) => !d.parent);
  }, [categoryTree]);

  const navLinks = useMemo(() => {
    const raw = brand.catalog?.nav?.length ? brand.catalog.nav : FALLBACK_NAV;
    return raw.map((link) => ({
      ...link,
      label: link.label || link.name || "Link",
    }));
  }, []);

  const cartTotal = formatPrice ? formatPrice(getCartAmount?.() || 0) : `₹${getCartAmount?.() || 0}`;

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
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    setOpenMega(null);
    setMegaViaKeyboard(false);
    setDrawerOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    return () => {
      if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current);
    };
  }, []);

  const openMegaMenu = (key, viaKeyboard = false) => {
    if (megaCloseTimer.current) {
      clearTimeout(megaCloseTimer.current);
      megaCloseTimer.current = null;
    }
    setMegaViaKeyboard(viaKeyboard);
    setOpenMega(key);
  };

  const scheduleCloseMega = () => {
    if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current);
    megaCloseTimer.current = setTimeout(() => {
      setOpenMega(null);
      setMegaViaKeyboard(false);
    }, 120);
  };

  const signOut = () => {
    signOutUser({ silent: true });
    navigate("/");
  };

  const getMegaColumns = (megaKey) => {
    const fallback = brand.catalog?.megaMenu?.[megaKey] || [];
    const dept = departments.find(
      (d) => d.slug === megaKey || d.name?.toLowerCase() === megaKey
    );
    return buildMegaColumns(dept, fallback);
  };

  const iconBtn =
    "inline-flex items-center justify-center w-9 h-9 rounded-sm text-tz-navy/80 hover:text-tz-navy hover:bg-gray-100 transition-colors";

  const linkClass = (active, highlight) =>
    `relative inline-flex items-center gap-1 px-2 xl:px-2.5 py-1.5 text-[10px] xl:text-[11px] font-semibold uppercase tracking-[0.07em] transition-colors whitespace-nowrap ${
      highlight
        ? active
          ? "text-tz-navy underline underline-offset-[5px] decoration-2"
          : "text-tz-navy ring-1 ring-tz-navy/80 px-2.5"
        : active
          ? "text-tz-navy"
          : "text-tz-navy/75 hover:text-tz-navy"
    }`;

  const renderNavLinks = () =>
    navLinks.map((link) => {
      const active = isNavActive(link.path, location);
      const hasMega = Boolean(link.mega);
      const columns = hasMega ? getMegaColumns(link.mega) : [];

      if (hasMega && columns.length) {
        return (
          <div
            key={link.path + link.label}
            className="relative shrink-0"
            onMouseEnter={() => openMegaMenu(link.mega, false)}
            onMouseLeave={scheduleCloseMega}
          >
            <NavLink
              to={link.path}
              className={linkClass(active || openMega === link.mega, link.highlight)}
              aria-expanded={openMega === link.mega}
              aria-haspopup="true"
              onFocus={() => openMegaMenu(link.mega, true)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
                  if (e.key !== "Enter") e.preventDefault();
                  openMegaMenu(link.mega, true);
                }
                if (e.key === "Escape") {
                  setOpenMega(null);
                  setMegaViaKeyboard(false);
                }
              }}
            >
              {link.label}
              <FaChevronDown size={8} className="opacity-50" aria-hidden />
              {(active || openMega === link.mega) && (
                <span className="absolute left-1.5 right-1.5 bottom-0 h-[2px] bg-tz-navy" />
              )}
            </NavLink>
          </div>
        );
      }

      return (
        <NavLink
          key={link.path + link.label}
          to={link.path}
          className={linkClass(active, link.highlight)}
        >
          {link.label}
          {active ? (
            <span className="absolute left-1.5 right-1.5 bottom-0 h-[2px] bg-tz-navy" />
          ) : null}
        </NavLink>
      );
    });

  const openMegaColumns = openMega ? getMegaColumns(openMega) : [];

  return (
    <>
      <header
        className={`relative w-full border-b bg-white z-40 transition-[box-shadow,border-color] duration-300 overflow-visible ${
          scrolled ? "border-gray-200 shadow-nav" : "border-gray-100 shadow-none"
        }`}
        onMouseLeave={scheduleCloseMega}
      >
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 overflow-visible">
          {/* ── Desktop: single chrome row ── */}
          <div
            className={`hidden lg:flex items-center gap-3 xl:gap-4 overflow-visible transition-[min-height] duration-300 ${
              scrolled ? "min-h-[52px] h-[52px]" : "min-h-[60px] h-[60px]"
            }`}
          >
            <Link to="/" className="shrink-0 flex items-center min-w-0" aria-label={brand.name}>
              <BrandMark className={scrolled ? "h-7" : "h-8"} compact={scrolled} />
            </Link>

            <nav className="flex-1 flex items-center justify-center gap-0 min-w-0 overflow-visible">
              {renderNavLinks()}
            </nav>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                aria-label="Search"
                onClick={() => setShowSearch(true)}
                className={iconBtn}
              >
                <FaSearch size={14} />
              </button>
              <CurrencySelector />
              <Link to="/wishlist" className={`${iconBtn} relative`} aria-label="Wishlist">
                <FaHeart size={13} />
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
                  onClick={() => navigate(token ? "/account" : "/login")}
                >
                  <FaUser size={13} />
                </button>
                <AnimatePresence>
                  {hoveredProfile && token && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute right-0 top-full mt-1 w-40 bg-white shadow-xl border-t-2 border-t-tz-navy border-x border-b border-gray-200 overflow-hidden z-50"
                    >
                      <button
                        type="button"
                        onClick={() => navigate("/account")}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"
                      >
                        Account
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/orders")}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"
                      >
                        Orders
                      </button>
                      <button
                        type="button"
                        onClick={signOut}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-red-600"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                to="/cart"
                className="ml-0.5 inline-flex items-center gap-1.5 pl-1.5 pr-1 py-1.5 rounded-sm text-tz-navy hover:bg-gray-50 transition-colors"
                aria-label={`Cart ${cartCount} items, ${cartTotal}`}
              >
                <span className="relative inline-flex">
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor" aria-hidden>
                    <path d="M7 4h-2l-1 2H1v2h2l3.6 7.59-1.35 2.44A1 1 0 0 0 6 20h12v-2H7.42a.25.25 0 0 1-.22-.37L8.1 15h7.45a1 1 0 0 0 .92-.62L19 7H6.21l-.94-2zM8 21a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-tz-navy text-white text-[9px] font-bold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </span>
                <span className="text-xs font-semibold tabular-nums whitespace-nowrap">
                  {cartCount}
                  <span className="text-tz-navy/45 font-normal mx-0.5">·</span>
                  {cartTotal}
                </span>
              </Link>
            </div>
          </div>

          {/* Full-width mega panel under chrome (not inside nav flex) */}
          <AnimatePresence>
            {openMega && openMegaColumns.length > 0 ? (
              <div
                key={openMega}
                className="hidden lg:block"
                onMouseEnter={() => openMegaMenu(openMega, megaViaKeyboard)}
                onMouseLeave={scheduleCloseMega}
              >
                <MegaMenu
                  columns={openMegaColumns}
                  keyboardOpen={megaViaKeyboard}
                  onNavigate={() => {
                    setOpenMega(null);
                    setMegaViaKeyboard(false);
                  }}
                  onClose={() => {
                    setOpenMega(null);
                    setMegaViaKeyboard(false);
                  }}
                />
              </div>
            ) : null}
          </AnimatePresence>

          {/* ── Mobile header ── */}
          <div
            className={`lg:hidden flex items-center justify-between transition-[height] duration-300 ${
              scrolled ? "h-12" : "h-14"
            }`}
          >
            <button type="button" aria-label="Open menu" onClick={() => setDrawerOpen(true)} className={iconBtn}>
              <FaBars size={15} />
            </button>
            <Link to="/" className="flex items-center min-w-0 px-2" aria-label={brand.name}>
              <BrandMark className="h-7" compact />
            </Link>
            <div className="flex items-center">
              <button
                type="button"
                aria-label="Search"
                onClick={() => setShowSearch(true)}
                className={iconBtn}
              >
                <FaSearch size={14} />
              </button>
              <Link
                to="/cart"
                className={`${iconBtn} relative !w-auto !px-2 gap-1.5`}
                aria-label={`Cart ${cartCount} items, ${cartTotal}`}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
                  <path d="M7 4h-2l-1 2H1v2h2l3.6 7.59-1.35 2.44A1 1 0 0 0 6 20h12v-2H7.42a.25.25 0 0 1-.22-.37L8.1 15h7.45a1 1 0 0 0 .92-.62L19 7H6.21l-.94-2zM8 21a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
                </svg>
                {cartCount > 0 && (
                  <span className="text-[11px] font-semibold tabular-nums max-w-[4.5rem] truncate">
                    {cartTotal}
                  </span>
                )}
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-1 rounded-sm bg-tz-navy text-white text-[9px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-tz-navy/40 z-[60] lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed top-0 left-0 h-full w-[82%] max-w-sm bg-white z-[70] lg:hidden shadow-xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100">
                <BrandMark className="h-7" compact />
                <button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)} className={iconBtn}>
                  <FaTimes size={15} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-2 px-2">
                {navLinks.map((link) => {
                  const active = isNavActive(link.path, location);
                  const hasMega = Boolean(link.mega);
                  const columns = hasMega ? getMegaColumns(link.mega) : [];

                  if (hasMega && columns.length) {
                    const open = mobileMega === link.mega;
                    return (
                      <div key={link.path + link.label} className="border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => setMobileMega(open ? null : link.mega)}
                          className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold uppercase tracking-wide ${
                            active || open ? "text-tz-navy bg-gray-50" : "text-tz-navy/80"
                          }`}
                        >
                          {link.label}
                          <FaChevronDown
                            size={11}
                            className={`opacity-50 transition-transform ${open ? "rotate-180" : ""}`}
                          />
                        </button>
                        {open && (
                          <div className="pb-3 px-4 space-y-3">
                            <Link
                              to={link.path}
                              onClick={() => setDrawerOpen(false)}
                              className="block text-xs font-semibold text-tz-navy/70 py-1"
                            >
                              View all {link.label}
                            </Link>
                            {columns.map((col) => (
                              <div key={col.title}>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-tz-navy/50 mb-1">
                                  {col.title}
                                </p>
                                {(col.links || []).map((item) => (
                                  <Link
                                    key={item.path + item.label}
                                    to={item.path}
                                    onClick={() => setDrawerOpen(false)}
                                    className="block py-1.5 text-sm text-tz-navy/75"
                                  >
                                    {item.label}
                                  </Link>
                                ))}
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
                      onClick={() => setDrawerOpen(false)}
                      className={`block px-4 py-3.5 border-b border-gray-100 text-sm font-semibold uppercase tracking-wide ${
                        active ? "bg-gray-50 text-tz-navy" : "text-tz-navy/80"
                      } ${link.highlight ? "text-tz-navy" : ""}`}
                    >
                      {link.label}
                    </NavLink>
                  );
                })}
                <Link
                  to="/wishlist"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-100 text-sm font-semibold text-tz-navy/80"
                >
                  <FaHeart size={12} className="opacity-50" /> Wishlist
                </Link>
                {token ? (
                  <>
                    <Link
                      to="/account"
                      onClick={() => setDrawerOpen(false)}
                      className="block px-4 py-3.5 border-b border-gray-100 text-sm font-semibold text-tz-navy/80"
                    >
                      Account
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setDrawerOpen(false)}
                      className="block px-4 py-3.5 border-b border-gray-100 text-sm font-semibold text-tz-navy/80"
                    >
                      Orders
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        setDrawerOpen(false);
                      }}
                      className="w-full text-left px-4 py-3.5 text-sm font-semibold text-red-600"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-4 py-3.5 text-sm font-semibold text-tz-navy/80"
                  >
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
