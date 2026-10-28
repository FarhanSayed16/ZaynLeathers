/**
 * Category / department slug helpers for Woo ↔ storefront alignment.
 * Brand nav uses canonical slugs (men, women, accessories, kids…);
 * legacy `bags` URLs alias into accessories.
 */
import brand from "../brand";

const DEFAULT_ALIASES = {
  men: ["men", "mens", "men-s", "mens-jackets", "men-jackets"],
  women: ["women", "womens", "women-s", "womens-jackets", "women-jackets"],
  kids: ["kids", "kid", "children", "boys", "girls", "kids-leather-jackets"],
  accessories: [
    "accessories",
    "accessory",
    "bags",
    "bag",
    "handbags",
    "totes",
    "leather-bags",
    "belts",
    "wallets",
    "gloves",
  ],
  "movie-jackets": ["movie-jackets", "movie", "celebrity-jackets"],
  "superhero-jackets": ["superhero-jackets", "superhero"],
  "video-game-jackets": ["video-game-jackets", "video-game", "gaming-jackets"],
  "leather-jackets": ["leather-jackets", "women-leather-jackets", "mens-leather-jackets"],
  "suede-jackets": ["suede-jackets", "women-suede-jackets", "mens-suede-jackets"],
  "biker-jackets": ["biker-jackets", "women-biker-jackets"],
  "bomber-jackets": ["bomber-jackets", "women-bomber-jackets"],
  "sheepskin-jackets": ["sheepskin-jackets", "women-sheepskin-jackets"],
  "leather-shirt-jackets": ["leather-shirt-jackets", "shirt-jackets", "suede-shirts", "women-leather-shirt-jackets"],
  "double-breasted-coats": ["double-breasted-coats", "women-double-breasted-coats"],
  "trench-coats": ["trench-coats", "women-trench-coats"],
  "wool-jackets": ["wool-jackets", "women-wool-jackets"],
  "oversized-jackets": ["oversized-jackets", "women-oversized-jackets"],
  "leather-blazers": ["leather-blazers", "women-leather-blazers"],
  "hooded-jackets": ["hooded-jackets", "women-hooded-jackets"],
  "leather-coats": ["leather-coats", "women-leather-coats"],
  "sheepskin-coats": ["sheepskin-coats", "women-sheepskin-coats"],
  "leather-pants": ["leather-pants", "women-leather-pants"],
  "leather-cushion-covers": ["leather-cushion-covers", "cushion-covers", "pillow-covers"],
};

/** Departments used for Shop chips / product.department */
const DEPARTMENT_KEYS = ["men", "women", "kids", "accessories"];

function aliasTable() {
  return { ...DEFAULT_ALIASES, ...(brand.catalog?.slugAliases || {}) };
}

export function departmentCanonicals() {
  const table = aliasTable();
  return DEPARTMENT_KEYS.filter((k) => table[k] || k);
}

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

export function canonicalizeSlug(slug) {
  const key = String(slug || "").toLowerCase().trim();
  if (!key) return "";
  const table = aliasTable();
  if (table[key] && DEPARTMENT_KEYS.includes(key)) return key;
  if (table[key] && !DEPARTMENT_KEYS.includes(key)) {
    // leaf theme slugs (movie-jackets) stay as themselves
    return key;
  }
  for (const [canonical, aliases] of Object.entries(table)) {
    if (aliases.map((s) => String(s).toLowerCase()).includes(key)) {
      return canonical;
    }
  }
  return key;
}

/** Map legacy department=bags → accessories for filters / chips */
export function normalizeDepartment(slug) {
  const c = canonicalizeSlug(slug);
  if (c === "bags" || String(slug).toLowerCase() === "bags") return "accessories";
  if (DEPARTMENT_KEYS.includes(c)) return c;
  // bags listed only as accessories alias
  const expanded = expandSlug(slug);
  if (expanded.includes("accessories") && !DEPARTMENT_KEYS.includes(c)) {
    if (["bags", "bag", "handbags", "totes"].includes(String(slug).toLowerCase())) {
      return "accessories";
    }
  }
  return c;
}

export function productMatchesDepartment(product, department) {
  const wanted = expandSlug(normalizeDepartment(department) || department);
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

export function resolveDepartmentFromCategories(cats = []) {
  const slugs = cats.map((c) => c.slug).filter(Boolean);
  for (const slug of slugs) {
    const canonical = normalizeDepartment(slug);
    if (DEPARTMENT_KEYS.includes(canonical)) return canonical;
  }
  return normalizeDepartment(slugs[0] || "") || canonicalizeSlug(slugs[0] || "");
}

export function titleCaseColor(slug) {
  const s = String(slug || "").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
