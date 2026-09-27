import { useContext, useEffect, useState } from "react";
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

const SearchBar = () => {
  const { search, setSearch, showSearch, setShowSearch } = useContext(ShopContext);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
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
    <div className="border-b border-tz-pink/10 bg-white/95 backdrop-blur-sm text-center relative z-40">
      <div className="inline-flex items-center justify-center border border-tz-navy/10 bg-tz-cream rounded-full px-5 py-2.5 my-3.5 mx-3 w-[90%] sm:w-1/2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") goToResults();
          }}
          className="flex-1 outline-none bg-transparent text-sm text-tz-navy"
          type="text"
          placeholder="Search jackets, bags, belts…"
          autoFocus
        />
        <button type="button" onClick={() => goToResults()} aria-label="Search">
          <FaSearch className="w-3.5 h-3.5 opacity-45 text-tz-navy shrink-0" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          setShowSearch(false);
          if (!location.pathname.includes("shop")) setSearch("");
        }}
        className="inline-flex align-middle ml-1 p-1"
        aria-label="Close search"
      >
        <FaTimes className="w-3.5 h-3.5 opacity-60 hover:opacity-100 text-tz-navy" />
      </button>

      {filteredSuggestions.length > 0 && (
        <div className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 w-[90%] sm:w-1/2 bg-white shadow-soft border border-tz-pink/20 rounded-xl z-10 text-left overflow-hidden">
          {filteredSuggestions.map((item) => (
            <button
              key={item}
              type="button"
              className="w-full text-left px-4 py-2.5 hover:bg-tz-pink-soft cursor-pointer text-sm text-tz-navy"
              onClick={() => goToResults(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
