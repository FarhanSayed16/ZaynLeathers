/**
 * ============================================================
 * Product Adapter — WooCommerce ↔ Frontend
 * ============================================================
 */

import { wcUrl, request } from "../wooClient.js";
import {
  resolveDepartmentFromCategories,
  tagListIncludes,
  titleCaseColor,
} from "../../utils/categoryMap.js";

const BESTSELLER_TAGS = ["bestseller", "best-seller", "best-sellers", "best-selling"];
const NEW_ARRIVAL_TAGS = ["new-arrival", "new-arrivals", "new", "newest"];
const DEPARTMENT_SLUGS = ["men", "women", "kids", "bags", "accessories"];

function formatDimensions(dimensions) {
  if (!dimensions) return "";
  if (typeof dimensions === "string") return dimensions.trim();
  const parts = [dimensions.length, dimensions.width, dimensions.height]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  return parts.join(" × ");
}

function findAttribute(wc, names) {
  const wanted = names.map((n) => String(n).toLowerCase());
  return (wc.attributes || []).find((a) => {
    const name = String(a.name || "").toLowerCase();
    const slug = String(a.slug || "").toLowerCase().replace(/^pa_/, "");
    return wanted.includes(name) || wanted.includes(slug) || wanted.includes(`pa_${slug}`);
  });
}

function mapColorFields(wc) {
  const colorAttr = findAttribute(wc, ["color", "colour", "pa_color", "pa_colour"]);
  const options = (colorAttr?.options || [])
    .map((o) => titleCaseColor(String(o).replace(/[-_]/g, " ")))
    .filter(Boolean);
  return {
    color: options[0] || "",
    colors: options,
  };
}

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
    categorySlugs.find((s) => !DEPARTMENT_SLUGS.includes(s)) ||
    categorySlugs[1] ||
    categorySlugs[0] ||
    "";

  const sizeAttr = findAttribute(wc, ["size", "pa_size"]);
  const sizes = sizeAttr?.options || ["Free Size"];

  const materialAttr = findAttribute(wc, ["material", "pa_material"]);
  const material = materialAttr?.options?.[0] || "";

  const { color, colors } = mapColorFields(wc);

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
    color,
    colors,
    material,
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
    dimensions: formatDimensions(wc.dimensions),
    type: wc.type || "simple",
    variationIds: Array.isArray(wc.variations) ? wc.variations : [],
  };
}

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "FREE SIZE", "ONE SIZE"];

function sizeRank(size) {
  const index = SIZE_ORDER.indexOf(String(size || "").toUpperCase());
  return index === -1 ? SIZE_ORDER.length : index;
}

function variationQty(variation) {
  if (variation?.manage_stock) return Math.max(0, Number(variation.stock_quantity) || 0);
  return variation?.stock_status === "outofstock" ? 0 : 1;
}

function sizeFromVariation(variation) {
  const attr = (variation.attributes || []).find((item) => {
    const name = String(item.name || item.slug || "").toLowerCase().replace(/^pa_/, "");
    return name === "size";
  });
  return String(attr?.option || "One Size");
}

function applyVariationStock(product, variations) {
  if (!variations?.length) {
    const qty = product.stock != null
      ? Math.max(0, Number(product.stock) || 0)
      : product.inStock ? 1 : 0;
    product.availableQuantity = qty;
    product.stock = qty;
    product.inStock = qty > 0;
    return product;
  }

  const sizeMatrix = variations
    .map((variation) => ({
      size: sizeFromVariation(variation),
      price: Number(variation.price || variation.regular_price || product.price) || 0,
      qty: variationQty(variation),
    }))
    .sort((a, b) => sizeRank(a.size) - sizeRank(b.size));

  const total = sizeMatrix.reduce((sum, row) => sum + row.qty, 0);
  product.sizeMatrix = sizeMatrix;
  product.sizes = sizeMatrix.map((row) => row.size);
  product.availableQuantity = total;
  product.stock = total;
  product.inStock = total > 0;
  return product;
}

async function withVariationStock(products) {
  const list = Array.isArray(products) ? products : [products];
  await Promise.all(list.map(async (product) => {
    if (product.type !== "variable" || !product.variationIds?.length) {
      applyVariationStock(product, []);
      return;
    }
    try {
      const url = wcUrl(`products/${product._id}/variations`, { per_page: 100 });
      const variations = await request(url);
      applyVariationStock(product, variations);
    } catch (err) {
      console.error("Could not load size stock", product._id, err);
      applyVariationStock(product, []);
    }
  }));
  return products;
}

export async function fetchProducts({ perPage = 100, page = 1, hydrateVariations = false } = {}) {
  const url = wcUrl("products", {
    per_page: perPage,
    page,
    status: "publish",
    orderby: "date",
    order: "desc",
  });
  const products = await request(url);
  const mapped = products.map(mapProduct);
  // Size stock is loaded on the product page. Doing it for every listing
  // would fire one extra request per jacket once the full catalog is in.
  if (hydrateVariations) await withVariationStock(mapped);
  return mapped;
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
  const mapped = mapProduct(wc);
  await withVariationStock([mapped]);
  return mapped;
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
  const mapped = products.map(mapProduct);
  return mapped;
}

export async function searchProducts(query) {
  const url = wcUrl("products", {
    search: query,
    per_page: 20,
    status: "publish",
  });
  const products = await request(url);
  const mapped = products.map(mapProduct);
  return mapped;
}

export { mapProduct };
