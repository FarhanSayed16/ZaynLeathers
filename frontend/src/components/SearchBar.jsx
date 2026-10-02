import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { FaSearch, FaTimes } from "react-icons/fa";
import brand from "../brand";

const SUGGESTIONS = brand.catalog?.searchSuggestions || [
  "Leather Jacket",
  "Biker Jacket",
  "Handbag",
  "Laptop Bag",
  "Sling Bag",
  "Backpack",
  "Wallet",
  "Belt",
];

/**
 * Full-viewport search overlay (desktop + mobile) — opened from header search icon.
 */
const SearchBar = () => {
  const { search, setSearch, showSearch, setShowSearch } = useContext(ShopContext);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const inputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredSuggestions([]);
    } else {
      setFilteredSuggestions(
        SUGGESTIONS.filter((item) => item.toLowerCase().includes(search.toLowerCase()))
      );
    }
  }, [search]);

  useEffect(() => {
    if (!showSearch) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e) => {
      if (e.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [showSearch]);

  const closeSearch = () => {
    setShowSearch(false);
    if (!location.pathname.includes("shop")) setSearch("");
  };

  const goToResults = (query) => {
    const q = (query ?? search).trim();
    setSearch(q);
    setFilteredSuggestions([]);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    navigate(`/shop${params.toString() ? `?${params}` : ""}`);
    setShowSearch(false);
  };

  if (!showSearch) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-white"
      role="search"
      aria-label="Site search"
    >
      <div className="flex items-center gap-2 px-4 h-14 border-b border-gray-100 shrink-0">
        <form
          className="flex-1 flex items-center border border-gray-300 bg-white px-4 py-2.5 max-w-3xl mx-auto w-full focus-within:border-tz-navy"
          onSubmit={(e) => {
            e.preventDefault();
            goToResults();
          }}
        >
          <FaSearch className="w-3.5 h-3.5 opacity-45 text-tz-navy shrink-0 mr-3" aria-hidden />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none bg-transparent text-sm text-tz-navy placeholder:text-tz-navy/40"
            type="search"
            placeholder="Search jackets, bags, belts…"
            aria-label="Search products"
            autoComplete="off"
          />
          <button type="submit" aria-label="Search" className="text-tz-navy/50 hover:text-tz-navy pl-2">
            <span className="sr-only">Search</span>
            <FaSearch className="w-3.5 h-3.5" />
          </button>
        </form>
        <button
          type="button"
          onClick={closeSearch}
          className="shrink-0 w-10 h-10 inline-flex items-center justify-center text-tz-navy/60 hover:text-tz-navy"
          aria-label="Close search"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto px-4 py-4">
        {filteredSuggestions.length > 0 ? (
          <div className="border border-gray-100 overflow-hidden">
            {filteredSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-tz-navy border-b border-gray-50 last:border-0"
                onClick={() => goToResults(item)}
              >
                {item}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-tz-navy/45 mb-3">
              Popular searches
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.slice(0, 8).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => goToResults(item)}
                  className="px-3 py-1.5 text-xs border border-gray-200 text-tz-navy/80 hover:border-tz-navy"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
