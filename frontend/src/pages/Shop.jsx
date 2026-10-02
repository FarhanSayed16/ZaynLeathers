import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import ProductItem from "../components/ProductItem";
import { dedupeProductsByStyle } from "../utils/styleListing";
import SEO from "../components/SEO";
import Breadcrumbs from "../components/Breadcrumbs";
import {
  productMatchesCategory,
  productMatchesDepartment,
} from "../utils/categoryMap";

const CATEGORY_CHIPS = [
  { label: "All", value: "" },
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
  { label: "Bags", value: "bags" },
  { label: "Accessories", value: "accessories" },
];

const PRICE_ABS_MIN = 0;
const PRICE_ABS_MAX = 50000;

function isInStock(item) {
  if (item.inStock === false) return false;
  if (item.inStock === true) return true;
  if (item.availableQuantity != null) return Number(item.availableQuantity) > 0;
  if (item.stock != null) return Number(item.stock) > 0;
  return true;
}

const Shop = () => {
  const [filterProducts, setFilterProducts] = useState([]);
  const { products, search, setSearch, categories, categoryTree } = useContext(ShopContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState("relevant");
  const [material, setMaterial] = useState([]);
  const [color, setColor] = useState([]);
  const [availability, setAvailability] = useState("all"); // all | in | out
  const [priceRange, setPriceRange] = useState([PRICE_ABS_MIN, PRICE_ABS_MAX]);
  const [currentPage, setCurrentPage] = useState(1);
  const [catalogReady, setCatalogReady] = useState(false);
  const itemsPerPage = 16;

  const urlDepartment = searchParams.get("department") || "";
  const urlCategorySlug = searchParams.get("category") || "";
  const urlQuery = searchParams.get("q") || "";
  const urlSort = searchParams.get("sort") || "";

  // Price bounds from catalogue
  const priceBounds = useMemo(() => {
    if (!products.length) return { min: PRICE_ABS_MIN, max: PRICE_ABS_MAX };
    let min = Infinity;
    let max = 0;
    products.forEach((p) => {
      const price = Number(p.price) || 0;
      if (price > 0) {
        min = Math.min(min, price);
        max = Math.max(max, price);
      }
    });
    if (!Number.isFinite(min) || min === Infinity) min = PRICE_ABS_MIN;
    if (max < min) max = min + 1000;
    return { min: Math.floor(min), max: Math.ceil(max) };
  }, [products]);

  useEffect(() => {
    setPriceRange([priceBounds.min, priceBounds.max]);
  }, [priceBounds.min, priceBounds.max]);

  useEffect(() => {
    if (products.length > 0) setCatalogReady(true);
    else {
      const t = setTimeout(() => setCatalogReady(true), 1200);
      return () => clearTimeout(t);
    }
  }, [products.length]);

  useEffect(() => {
    if (urlDepartment) setCategory([urlDepartment]);
    else if (!urlDepartment && !urlCategorySlug) setCategory([]);
    if (urlCategorySlug) setSubCategory([urlCategorySlug]);
    else setSubCategory([]);
  }, [urlDepartment, urlCategorySlug]);

  useEffect(() => {
    setSearch(urlQuery);
  }, [urlQuery, setSearch]);

  useEffect(() => {
    if (urlSort === "newest") setSortType("newest");
    else if (urlSort === "price-asc") setSortType("low-high");
    else if (urlSort === "price-desc") setSortType("high-low");
  }, [urlSort]);

  const setUrlDepartment = useCallback(
    (value) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set("department", value);
      else next.delete("department");
      next.delete("category");
      setSearchParams(next, { replace: true });
      if (value) setCategory([value]);
      else setCategory([]);
      setSubCategory([]);
    },
    [searchParams, setSearchParams]
  );

  const syncSortToUrl = (value) => {
    setSortType(value);
    const next = new URLSearchParams(searchParams);
    if (value === "newest") next.set("sort", "newest");
    else if (value === "low-high") next.set("sort", "price-asc");
    else if (value === "high-low") next.set("sort", "price-desc");
    else next.delete("sort");
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [category, subCategory, material, color, search, sortType, availability, priceRange]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showFilter && window.innerWidth < 768) {
        const sidebar = document.getElementById("mobile-filter-sidebar");
        const triggerBtn = document.getElementById("filter-trigger-btn");
        if (
          sidebar &&
          !sidebar.contains(e.target) &&
          triggerBtn &&
          !triggerBtn.contains(e.target)
        ) {
          setShowFilter(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilter]);

  useEffect(() => {
    if (!showFilter) return undefined;
    if (window.innerWidth >= 768) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showFilter]);

  const syncCategoryToUrl = (nextCategories) => {
    const primary = nextCategories[0];
    const next = new URLSearchParams(searchParams);
    if (primary && nextCategories.length === 1) next.set("department", primary);
    else next.delete("department");
    next.delete("category");
    setSearchParams(next, { replace: true });
  };

  const toggleCategory = (e) => {
    const value = e.target.value;
    setCategory((prev) => {
      const next = prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value];
      syncCategoryToUrl(next);
      return next;
    });
  };

  const toggleSubCategory = (e) => {
    const value = e.target.value;
    setSubCategory((prev) => {
      const next = prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value];
      const params = new URLSearchParams(searchParams);
      if (next.length === 1) params.set("category", next[0]);
      else params.delete("category");
      setSearchParams(params, { replace: true });
      return next;
    });
  };

  const togglesetMaterial = (e) => {
    const value = e.target.value;
    setMaterial((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const togglesetColor = (e) => {
    const value = e.target.value;
    setColor((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const clearAllFilters = () => {
    setCategory([]);
    setSubCategory([]);
    setMaterial([]);
    setColor([]);
    setAvailability("all");
    setPriceRange([priceBounds.min, priceBounds.max]);
    setSortType("relevant");
    const next = new URLSearchParams(searchParams);
    next.delete("category");
    next.delete("department");
    next.delete("q");
    next.delete("sort");
    setSearch("");
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    let productsCopy = [...products];

    if (search && search.trim() !== "") {
      const normalize = (str) =>
        str.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
      const searchInput = normalize(search);
      const searchWords = searchInput.split(" ");

      productsCopy = productsCopy.filter((item) => {
        const searchableText = normalize(
          [
            item.name,
            item.secondaryName,
            item.color,
            item.description,
            item.material,
            item.subCategory,
            item.category,
            item.department,
            item.categorySlug,
          ]
            .filter(Boolean)
            .join(" ")
        );
        return searchWords.every((word) => searchableText.includes(word));
      });
    }

    if (category.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        category.some((dept) => productMatchesDepartment(item, dept))
      );
    }
    if (subCategory.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        subCategory.some((cat) => productMatchesCategory(item, cat))
      );
    }
    if (material.length > 0) {
      productsCopy = productsCopy.filter((item) => material.includes(item.material));
    }
    if (color.length > 0) {
      productsCopy = productsCopy.filter((item) => color.includes(item.color));
    }
    if (availability === "in") {
      productsCopy = productsCopy.filter((item) => isInStock(item));
    } else if (availability === "out") {
      productsCopy = productsCopy.filter((item) => !isInStock(item));
    }

    const [pMin, pMax] = priceRange;
    productsCopy = productsCopy.filter((item) => {
      const price = Number(item.price) || 0;
      return price >= pMin && price <= pMax;
    });

    productsCopy = dedupeProductsByStyle(productsCopy, { preferredColors: color });

    if (sortType === "low-high") {
      productsCopy = [...productsCopy].sort((a, b) => a.price - b.price);
    } else if (sortType === "high-low") {
      productsCopy = [...productsCopy].sort((a, b) => b.price - a.price);
    } else if (sortType === "newest") {
      productsCopy = [...productsCopy].sort((a, b) => {
        const da = new Date(a.date || 0).getTime();
        const db = new Date(b.date || 0).getTime();
        return db - da;
      });
    }

    setFilterProducts(productsCopy);
  }, [
    category,
    subCategory,
    material,
    color,
    search,
    products,
    sortType,
    availability,
    priceRange,
  ]);

  const activeFiltersCount =
    category.length +
    subCategory.length +
    material.length +
    color.length +
    (availability !== "all" ? 1 : 0) +
    (priceRange[0] > priceBounds.min || priceRange[1] < priceBounds.max ? 1 : 0);

  const headerCopy = useMemo(() => {
    const dept = category[0];
    const labels = {
      men: {
        title: "Men's Collection",
        subtitle: "Jackets, blazers, and leather essentials.",
        seo: "Men's Leather",
      },
      women: {
        title: "Women's Collection",
        subtitle: "Jackets and leather pieces made to last.",
        seo: "Women's Leather",
      },
      bags: {
        title: "Leather Bags",
        subtitle: "Handbags, laptop bags, backpacks, and slings.",
        seo: "Leather Bags",
      },
      accessories: {
        title: "Accessories",
        subtitle: "Wallets, belts, and finishing essentials.",
        seo: "Accessories",
      },
      kids: {
        title: "Kids",
        subtitle: "Leather styles for kids.",
        seo: "Kids Leather",
      },
    };
    if (dept && labels[dept]) return labels[dept];
    if (urlQuery) {
      return {
        title: `Search results`,
        subtitle: `Showing matches for “${urlQuery}”`,
        seo: `Search: ${urlQuery}`,
      };
    }
    if (sortType === "newest" || urlSort === "newest") {
      return {
        title: "New Arrivals",
        subtitle: "Fresh drops and latest leather pieces.",
        seo: "New Arrivals",
      };
    }
    return {
      title: "Shop All",
      subtitle: "Jackets, bags, and leather essentials — filter by price, colour, and style.",
      seo: "Shop Collection",
    };
  }, [category, urlQuery, sortType, urlSort]);

  const breadcrumbItems = useMemo(() => {
    const items = [{ label: "Home", to: "/" }];
    if (category[0]) {
      const deptLabel =
        category[0].charAt(0).toUpperCase() + category[0].slice(1);
      items.push({
        label: deptLabel,
        to: subCategory.length ? `/shop?department=${category[0]}` : undefined,
      });
    } else if (sortType === "newest") {
      items.push({ label: "New Arrivals" });
      return items;
    } else {
      items.push({ label: "Shop" });
      return items;
    }
    if (subCategory[0]) {
      items.push({ label: subCategory[0].replace(/-/g, " ") });
    }
    return items;
  }, [category, subCategory, sortType]);

  const categoryOptions = useMemo(() => {
    const fromApi = (categories || []).filter((c) => c.type === "department");
    if (fromApi.length > 0) return fromApi;
    const fromTree = (categoryTree || []).filter(
      (d) => d.type === "department" || !d.parent
    );
    if (fromTree.length) return fromTree;
    return CATEGORY_CHIPS.filter((c) => c.value).map((c) => ({
      _id: c.value,
      name: c.label,
      slug: c.value,
    }));
  }, [categories, categoryTree]);

  const nestedCategoryLinks = useMemo(() => {
    const deptSlug = category[0];
    if (!deptSlug || !categoryTree?.length) {
      return (categories || [])
        .filter((c) => c.type === "category")
        .slice(0, 24);
    }
    const dept = categoryTree.find(
      (d) => d.slug === deptSlug || d.name?.toLowerCase() === deptSlug
    );
    if (!dept?.children?.length) {
      return (categories || [])
        .filter((c) => c.type === "category")
        .slice(0, 24);
    }
    const flat = [];
    dept.children.forEach((child) => {
      flat.push(child);
      (child.children || []).forEach((leaf) => flat.push(leaf));
    });
    return flat.slice(0, 30);
  }, [category, categoryTree, categories]);

  const FiltersBody = () => (
    <>
      <FilterSection title="Price Range">
        <PriceRangeSlider
          min={priceBounds.min}
          max={priceBounds.max}
          value={priceRange}
          onChange={setPriceRange}
        />
      </FilterSection>

      <FilterSection title="Availability">
        <div className="flex flex-col gap-2">
          {[
            { value: "all", label: "All Products" },
            { value: "in", label: "In Stock" },
            { value: "out", label: "Out of Stock" },
          ].map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 text-sm text-tz-navy/80 cursor-pointer hover:text-tz-navy"
            >
              <input
                type="radio"
                name="availability"
                value={opt.value}
                checked={availability === opt.value}
                onChange={() => setAvailability(opt.value)}
                className="w-4 h-4 border-gray-300 text-tz-navy focus:ring-tz-navy"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Department">
        <div className="flex flex-col gap-2">
          {categoryOptions.map((c) => (
            <Checkbox
              key={c._id}
              value={c.slug || c.name}
              checked={category.includes(c.slug || c.name)}
              onChange={toggleCategory}
              label={c.name}
            />
          ))}
        </div>
      </FilterSection>

      {nestedCategoryLinks.length > 0 && (
        <FilterSection title={category[0] ? category[0].toUpperCase() : "Categories"}>
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
            {nestedCategoryLinks.map((s) => (
              <Checkbox
                key={s._id || s.slug}
                value={s.slug || s.name}
                checked={
                  subCategory.includes(s.slug) || subCategory.includes(s.name)
                }
                onChange={toggleSubCategory}
                label={s.name}
              />
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Material">
        <div className="flex flex-col gap-2">
          {["Genuine Leather", "Lambskin", "Suede", "PU Leather", "Croco"].map(
            (m) => (
              <Checkbox
                key={m}
                value={m}
                checked={material.includes(m)}
                onChange={togglesetMaterial}
                label={m}
              />
            )
          )}
        </div>
      </FilterSection>

      <FilterSection title="Colour">
        <div className="grid grid-cols-2 gap-2">
          {[
            "Black",
            "Brown",
            "Tan",
            "Red",
            "Blue",
            "Green",
            "White",
            "Burgundy",
          ].map((c) => (
            <Checkbox
              key={c}
              value={c}
              checked={color.includes(c)}
              onChange={togglesetColor}
              label={c}
            />
          ))}
        </div>
      </FilterSection>
    </>
  );

  const loading = !catalogReady && products.length === 0;

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={headerCopy.seo}
        description="Browse Zayn Leathers jackets, bags, and leather essentials — filter by price, colour, and style."
      />

      {/* Page chrome — reference PLP style */}
      <section className="border-b border-gray-100 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-5">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-tz-navy tracking-tight mt-2">
            {headerCopy.title}
          </h1>
          <p className="mt-2 text-sm text-tz-navy/55 max-w-xl">
            {headerCopy.subtitle}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {CATEGORY_CHIPS.map((chip) => {
              const chipActive =
                chip.value === ""
                  ? !urlDepartment && !urlCategorySlug
                  : urlDepartment === chip.value;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setUrlDepartment(chip.value)}
                  className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors border ${
                    chipActive
                      ? "bg-tz-navy text-white border-tz-navy"
                      : "bg-white text-tz-navy border-gray-200 hover:border-tz-navy"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-24">
        {/* Mobile toolbar */}
        <div className="flex items-center justify-between gap-3 mb-5 md:hidden">
          <button
            id="filter-trigger-btn"
            type="button"
            onClick={() => setShowFilter(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-tz-navy text-white hover:bg-tz-pink transition-colors text-sm font-medium"
          >
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 bg-white text-tz-navy text-xs rounded-full px-1.5 py-0.5 font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <SortSelect value={sortType} onChange={syncSortToUrl} />
        </div>

        {/* Desktop layout */}
        <div className="hidden md:flex gap-8 items-start">
          <aside className="w-64 lg:w-72 flex-shrink-0 sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain bg-white border border-gray-200 p-5 custom-scrollbar">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-semibold text-sm uppercase tracking-[0.12em] text-tz-navy">
                Filters
              </h3>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-tz-navy/50 hover:text-tz-navy underline"
                >
                  Clear ({activeFiltersCount})
                </button>
              )}
            </div>
            <FiltersBody />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-6 gap-4">
              <p className="text-sm text-tz-navy/55 font-medium">
                {loading
                  ? "Loading…"
                  : `${filterProducts.length} ${
                      filterProducts.length === 1 ? "product" : "products"
                    }`}
              </p>
              <SortSelect value={sortType} onChange={syncSortToUrl} />
            </div>
            <ProductGrid
              products={filterProducts}
              clearFilters={clearAllFilters}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              searchQuery={search}
              loading={loading}
            />
          </div>
        </div>

        {/* Mobile filter drawer */}
        {showFilter && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-tz-navy/50 backdrop-blur-sm"
              onClick={() => setShowFilter(false)}
            />
            <div
              id="mobile-filter-sidebar"
              className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl overflow-y-auto"
            >
              <div className="sticky top-0 z-10 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
                <h3 className="font-semibold text-tz-navy uppercase tracking-wide text-sm">
                  Filters
                </h3>
                <div className="flex gap-3 items-center">
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="text-xs text-tz-navy/50"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowFilter(false)}
                    className="text-2xl leading-5"
                  >
                    &times;
                  </button>
                </div>
              </div>
              <div className="p-4 pb-28">
                <FiltersBody />
              </div>
              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
                <button
                  type="button"
                  onClick={() => setShowFilter(false)}
                  className="w-full bg-tz-navy text-white hover:bg-tz-pink transition-colors py-3 font-medium text-sm"
                >
                  Show {filterProducts.length} results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile grid */}
        <div className="md:hidden mt-4">
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                ...category,
                ...subCategory,
                ...material,
                ...color,
                availability !== "all" ? availability : null,
              ]
                .filter(Boolean)
                .map((filter) => (
                  <span
                    key={filter}
                    className="bg-gray-100 text-tz-navy text-xs px-2.5 py-1 font-medium capitalize"
                  >
                    {filter}
                  </span>
                ))}
            </div>
          )}
          <ProductGrid
            products={filterProducts}
            clearFilters={clearAllFilters}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            searchQuery={search}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

const SortSelect = ({ value, onChange }) => (
  <select
    onChange={(e) => onChange(e.target.value)}
    value={value}
    className="border border-gray-200 text-sm px-3 py-2 bg-white focus:outline-none focus:border-tz-navy text-tz-navy"
    aria-label="Sort products"
  >
    <option value="relevant">Sort: Featured</option>
    <option value="newest">Sort: Newest</option>
    <option value="low-high">Sort: Price ↑</option>
    <option value="high-low">Sort: Price ↓</option>
  </select>
);

const FilterSection = ({ title, children }) => (
  <div className="border-b border-gray-200 py-4 first:pt-0 last:border-0">
    <p className="font-bold text-tz-navy mb-3 text-[11px] uppercase tracking-[0.14em]">
      {title}
    </p>
    <div className="space-y-2">{children}</div>
  </div>
);

const Checkbox = ({ value, checked, onChange, label }) => (
  <label className="flex items-center gap-2 text-sm text-tz-navy/80 cursor-pointer hover:text-tz-navy">
    <input
      type="checkbox"
      className="w-4 h-4 rounded-none border-gray-300 text-tz-navy focus:ring-tz-navy"
      value={value}
      onChange={onChange}
      checked={checked}
    />
    <span>{label}</span>
  </label>
);

const PriceRangeSlider = ({ min, max, value, onChange }) => {
  const [lo, hi] = value;
  const span = Math.max(max - min, 1);

  return (
    <div className="pt-1">
      <div className="relative h-6 flex items-center">
        <div className="absolute left-0 right-0 h-1 bg-gray-200 rounded" />
        <div
          className="absolute h-1 bg-tz-navy rounded"
          style={{
            left: `${((lo - min) / span) * 100}%`,
            right: `${100 - ((hi - min) / span) * 100}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={lo}
          onChange={(e) => {
            const next = Math.min(Number(e.target.value), hi - 1);
            onChange([next, hi]);
          }}
          className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-tz-navy [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-tz-navy [&::-moz-range-thumb]:border-0"
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={hi}
          onChange={(e) => {
            const next = Math.max(Number(e.target.value), lo + 1);
            onChange([lo, next]);
          }}
          className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-tz-navy [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-tz-navy [&::-moz-range-thumb]:border-0"
          aria-label="Maximum price"
        />
      </div>
      <div className="flex justify-between text-xs text-tz-navy/60 mt-2 tabular-nums">
        <span>₹{lo.toLocaleString("en-IN")}</span>
        <span>₹{hi.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
};

const ProductSkeleton = () => (
  <div className="animate-pulse">
    <div className="aspect-[3/4] bg-gray-100" />
    <div className="mt-3 h-3 bg-gray-100 rounded w-4/5 mx-auto" />
    <div className="mt-2 h-4 bg-gray-100 rounded w-1/3 mx-auto" />
  </div>
);

const ProductGrid = ({
  products,
  clearFilters,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  searchQuery,
  loading,
}) => {
  const totalPages = Math.ceil(products.length / itemsPerPage) || 1;
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {paginatedProducts.map((item) => (
          <ProductItem
            key={item._id}
            id={item._id}
            image={item.image}
            name={item.name}
            price={item.price}
            discount={item.discount}
            oldPrice={item.oldPrice}
            availableQuantity={item.availableQuantity}
            imageAlt={item.imageAlt}
            priceFrom={item.priceFrom}
          />
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-16 border border-gray-100">
            <p className="font-display text-xl text-tz-navy mb-2">
              {searchQuery?.trim()
                ? `No results for “${searchQuery.trim()}”`
                : "No pieces match these filters"}
            </p>
            <p className="text-tz-navy/55 text-sm">
              Try another price range, colour, or clear filters.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm text-white bg-tz-navy hover:bg-tz-pink px-5 py-2.5 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 border text-sm font-medium transition ${
              currentPage === 1
                ? "bg-gray-50 text-gray-400 border-transparent cursor-not-allowed"
                : "bg-white text-tz-navy border-gray-200 hover:border-tz-navy"
            }`}
          >
            Previous
          </button>
          <div className="flex items-center gap-2 text-sm text-tz-navy">
            <span className="font-semibold">{currentPage}</span>
            <span className="text-tz-navy/45">of {totalPages}</span>
          </div>
          <button
            type="button"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className={`px-4 py-2 border text-sm font-medium transition ${
              currentPage === totalPages
                ? "bg-gray-50 text-gray-400 border-transparent cursor-not-allowed"
                : "bg-white text-tz-navy border-gray-200 hover:border-tz-navy"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Shop;
