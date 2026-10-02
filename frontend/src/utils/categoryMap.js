/**
 * Category / department slug helpers for Woo ↔ storefront alignment (Phase G).
 * Brand nav uses canonical slugs (men, women, bags…); Woo may use mens, men-s, etc.
 */
import brand from "../brand";

const DEFAULT_ALIASES = {
  men: ["men", "mens", "men-s", "mens-jackets", "men-jackets"],
  women: ["women", "womens", "women-s", "womens-jackets", "women-jackets"],
  kids: ["kids", "kid", "children", "boys", "girls"],
  bags: ["bags", "bag", "handbags", "totes"],
  accessories: ["accessories", "accessory", "belts", "wallets", "gloves"],
  "movie-jackets": ["movie-jackets", "movie", "celebrity-jackets"],
};

function aliasTable() {
  return { ...DEFAULT_ALIASES, ...(brand.catalog?.slugAliases || {}) };
}

/** All known department canonical slugs */
export function departmentCanonicals() {
  return Object.keys(aliasTable());
}

/** Expand a canonical slug to itself + aliases */
export function expandSlug(slug) {
  const key = String(slug || "").toLowerCase().trim();
  if (!key) return [];
  const table = aliasTable();
  if (table[key]) return [...new Set([key, ...table[key].map((s) => String(s).toLowerCase())])];
  for (const [canonical, aliases] of Object.entries(table)) {
    const set = [canonical, ...aliases].map((s) => String(s).toLowerCase());
    if (set.includes(key)) return [...new Set(set)];
  }
  return [key];
}

/** Map any Woo/nav slug → canonical brand slug when known */
export function canonicalizeSlug(slug) {
  const key = String(slug || "").toLowerCase().trim();
  if (!key) return "";
  const table = aliasTable();
  if (table[key]) return key;
  for (const [canonical, aliases] of Object.entries(table)) {
    if (aliases.map((s) => String(s).toLowerCase()).includes(key)) return canonical;
  }
  return key;
}

/** True if product slug/name belongs to the requested department filter */
export function productMatchesDepartment(product, department) {
  const wanted = expandSlug(department);
  if (!wanted.length) return true;
  const hay = [
    product.department,
    ...(product.categorySlugs || []),
    product.categorySlug,
    product.category,
  ]
    .filter(Boolean)
    .map((s) => canonicalizeSlug(s));
  return hay.some((h) => wanted.includes(h) || wanted.includes(String(h).toLowerCase()));
}

/** True if product matches a category filter slug (leaf) */
export function productMatchesCategory(product, category) {
  const wanted = expandSlug(category);
  if (!wanted.length) return true;
  const hay = [
    product.categorySlug,
    ...(product.categorySlugs || []),
    product.subCategory,
    product.category,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase().replace(/\s+/g, "-"));
  return hay.some((h) => wanted.includes(h) || wanted.includes(canonicalizeSlug(h)));
}

const BESTSELLER_TAGS = ["bestseller", "best-seller", "best-sellers", "best-selling"];
const NEW_ARRIVAL_TAGS = ["new-arrival", "new-arrivals", "new", "newest"];

export function tagListIncludes(tags, candidates) {
  const set = (tags || []).map((t) => String(t).toLowerCase().trim());
  return candidates.some((c) => set.includes(c));
}

export function isBestsellerProduct(product) {
  return Boolean(product?.bestseller) || tagListIncludes(product?.tags, BESTSELLER_TAGS);
}

export function isNewArrivalProduct(product) {
  return Boolean(product?.newArrival) || tagListIncludes(product?.tags, NEW_ARRIVAL_TAGS);
}

/**
 * Pick department from Woo category list (prefer known top-level).
 */
export function resolveDepartmentFromCategories(cats = []) {
  const slugs = cats.map((c) => c.slug).filter(Boolean);
  for (const slug of slugs) {
    const canonical = canonicalizeSlug(slug);
    if (departmentCanonicals().includes(canonical)) return canonical;
  }
  return canonicalizeSlug(slugs[0] || "");
}
