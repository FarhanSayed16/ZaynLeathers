/**
 * ============================================================
 * Product Adapter — WooCommerce ↔ Frontend
 * ============================================================
 * Maps WooCommerce product data to the shape your existing
 * React components expect (same as your Mongo/Express backend).
 * ============================================================
 */

import { wcUrl, request } from "../wooClient.js";

/**
 * Map a single WooCommerce product object → your frontend product shape.
 *
 * Your current frontend expects:
 * { _id, name, description, price, image, category, subCategory,
 *   sizes, bestseller, date, images, ... }
 */
function mapProduct(wc) {
  // Extract images
  const images = (wc.images || []).map((img) => img.src);

  // Extract categories
  const cats = wc.categories || [];
  const category = cats[0]?.name || "";
  const subCategory = cats[1]?.name || "";

  // Extract sizes from WooCommerce attributes (assumes an attribute named "Size")
  const sizeAttr = (wc.attributes || []).find(
    (a) => a.name.toLowerCase() === "size"
  );
  const sizes = sizeAttr?.options || ["Free Size"];

  // Price — WooCommerce stores sale_price and regular_price as strings
  const price = Number(wc.sale_price || wc.price || wc.regular_price || 0);
  const originalPrice = Number(wc.regular_price || price);

  // Size-specific pricing from metadata (custom field `_size_prices`)
  // e.g. { "S": 2999, "M": 3499, "L": 3999 }
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

  // Stock / variant matrix from metadata
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

  return {
    _id: String(wc.id),
    name: wc.name || "",
    description: wc.description || wc.short_description || "",
    shortDescription: wc.short_description || "",
    price,
    originalPrice,
    onSale: wc.on_sale || false,
    image: images,                     // array (your frontend expects `image` as array)
    category,
    subCategory,
    department: cats[0]?.slug || "",
    sizes,
    sizePrices,
    variantMatrix,
    bestseller: wc.featured || false,
    date: wc.date_created || new Date().toISOString(),
    sku: wc.sku || "",
    stock: wc.stock_quantity,
    inStock: wc.in_stock !== false,
    slug: wc.slug || "",
    tags: (wc.tags || []).map((t) => t.name),
    averageRating: Number(wc.average_rating || 0),
    ratingCount: Number(wc.rating_count || 0),
    weight: wc.weight || "",
    dimensions: wc.dimensions || {},
    // Keep raw WC data accessible if needed
    _wc: wc,
  };
}

/**
 * Fetch all products from WooCommerce.
 * WooCommerce paginates (default 10 per page), so we fetch in chunks.
 */
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

/**
 * Fetch ALL products (handles pagination automatically).
 */
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

/**
 * Fetch a single product by ID.
 */
export async function fetchProduct(productId) {
  const url = wcUrl(`products/${productId}`);
  const wc = await request(url);
  return mapProduct(wc);
}

/**
 * Fetch products by category slug.
 */
export async function fetchProductsByCategory(categorySlug) {
  // First, find the category ID from slug
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

/**
 * Search products.
 */
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
