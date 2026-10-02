/**
 * ============================================================
 * Product Adapter — WooCommerce ↔ Frontend
 * ============================================================
 */

import { wcUrl, request } from "../wooClient.js";
import {
  resolveDepartmentFromCategories,
  tagListIncludes,
} from "../../utils/categoryMap.js";

const BESTSELLER_TAGS = ["bestseller", "best-seller", "best-sellers", "best-selling"];
const NEW_ARRIVAL_TAGS = ["new-arrival", "new-arrivals", "new", "newest"];

/**
 * Map a single WooCommerce product object → frontend product shape.
 */
function mapProduct(wc) {
  const images = (wc.images || []).map((img) => img.src);

  const cats = wc.categories || [];
  const category = cats[0]?.name || "";
  const subCategory = cats[1]?.name || "";
  const categorySlugs = cats.map((c) => c.slug).filter(Boolean);
  // Prefer leaf category for filters; department is top-level
  const categorySlug =
    categorySlugs.find((s) => !["men", "women", "kids", "bags", "accessories"].includes(s)) ||
    categorySlugs[1] ||
    categorySlugs[0] ||
    "";

  const sizeAttr = (wc.attributes || []).find(
    (a) => a.name.toLowerCase() === "size"
  );
  const sizes = sizeAttr?.options || ["Free Size"];

  const price = Number(wc.sale_price || wc.price || wc.regular_price || 0);
  const originalPrice = Number(wc.regular_price || price);

  const sizePricesMeta = (wc.meta_data || []).find(
    (m) => m.key === "_size_prices"
  );
  let sizePrices = null;
  if (sizePricesMeta?.value) {
    try {
      sizePrices =
        typeof sizePricesMeta.value === "string"
          ? JSON.parse(sizePricesMeta.value)
          : sizePricesMeta.value;
    } catch {
      sizePrices = null;
    }
  }

  const matrixMeta = (wc.meta_data || []).find((m) => m.key === "_variant_matrix");
  let variantMatrix = null;
  if (matrixMeta?.value) {
    try {
      variantMatrix =
        typeof matrixMeta.value === "string"
          ? JSON.parse(matrixMeta.value)
          : matrixMeta.value;
    } catch {
      variantMatrix = null;
    }
  }

  const tagSlugs = (wc.tags || []).map((t) =>
    String(t.slug || t.name || "")
      .toLowerCase()
      .trim()
  );
  const hasBestsellerTag = tagListIncludes(tagSlugs, BESTSELLER_TAGS);
  const hasNewTag = tagListIncludes(tagSlugs, NEW_ARRIVAL_TAGS);

  return {
    _id: String(wc.id),
    name: wc.name || "",
    description: wc.description || wc.short_description || "",
    shortDescription: wc.short_description || "",
    price,
    originalPrice,
    onSale: wc.on_sale || false,
    image: images,
    category,
    subCategory,
    categorySlug,
    categorySlugs,
    department: resolveDepartmentFromCategories(cats),
    sizes,
    sizePrices,
    variantMatrix,
    // Featured in Woo admin → bestsellers; tag "bestseller" also counts
    bestseller: Boolean(wc.featured) || hasBestsellerTag,
    featured: Boolean(wc.featured),
    // New arrivals: Woo tags (not the same as featured)
    newArrival: hasNewTag,
    date: wc.date_created || new Date().toISOString(),
    sku: wc.sku || "",
    stock: wc.stock_quantity,
    inStock: wc.in_stock !== false,
    slug: wc.slug || "",
    tags: tagSlugs,
    averageRating: Number(wc.average_rating || 0),
    ratingCount: Number(wc.rating_count || 0),
    weight: wc.weight || "",
    dimensions: wc.dimensions || {},
    _wc: wc,
  };
}

export async function fetchProducts({ perPage = 100, page = 1 } = {}) {
  const url = wcUrl("products", {
    per_page: perPage,
    page,
    status: "publish",
    orderby: "date",
    order: "desc",
  });
  const products = await request(url);
  return products.map(mapProduct);
}

export async function fetchAllProducts() {
  const all = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const batch = await fetchProducts({ perPage, page });
    all.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }

  return all;
}

export async function fetchProduct(productId) {
  const url = wcUrl(`products/${productId}`);
  const wc = await request(url);
  return mapProduct(wc);
}

export async function fetchProductsByCategory(categorySlug) {
  const catUrl = wcUrl("products/categories", { slug: categorySlug });
  const cats = await request(catUrl);
  if (!cats.length) return [];

  const catId = cats[0].id;
  const url = wcUrl("products", {
    category: catId,
    per_page: 100,
    status: "publish",
  });
  const products = await request(url);
  return products.map(mapProduct);
}

export async function searchProducts(query) {
  const url = wcUrl("products", {
    search: query,
    per_page: 20,
    status: "publish",
  });
  const products = await request(url);
  return products.map(mapProduct);
}

export { mapProduct };
