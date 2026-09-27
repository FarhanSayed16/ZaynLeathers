import { ensureSizeMatrix, getTotalStock } from "./productMatrix";

export function pickPrimaryVariant(variants, options = {}) {
  const { preferredColors = [] } = options;
  if (!variants?.length) return null;

  const active = variants.filter((v) => v.isActive !== false);
  const pool = active.length ? active : variants;

  if (preferredColors.length) {
    const match = pool.find((v) => preferredColors.includes(v.color));
    if (match) return match;
  }

  return (
    pool.find((v) => v.isPrimaryListing) ||
    pool.find((v) => v.featured) ||
    pool.find((v) => v.bestseller) ||
    pool[0]
  );
}

export function getStyleMinPrice(variants) {
  let min = Infinity;
  for (const variant of variants.filter((v) => v.isActive !== false)) {
    const matrix = ensureSizeMatrix(variant);
    for (const row of matrix) {
      if (row.price > 0) min = Math.min(min, row.price);
    }
    if (variant.price > 0) min = Math.min(min, Number(variant.price));
  }
  return min === Infinity ? 0 : min;
}

export function getStyleOldPrice(variants, minPrice) {
  let old = 0;
  for (const variant of variants.filter((v) => v.isActive !== false)) {
    const matrix = ensureSizeMatrix(variant);
    for (const row of matrix) {
      if (row.oldPrice != null && row.oldPrice > minPrice) {
        old = old ? Math.min(old, row.oldPrice) : row.oldPrice;
      }
    }
    if (variant.oldPrice != null && variant.oldPrice > minPrice) {
      old = old ? Math.min(old, Number(variant.oldPrice)) : Number(variant.oldPrice);
    }
  }
  return old || undefined;
}

export function getStyleTotalStock(variants) {
  return variants
    .filter((v) => v.isActive !== false)
    .reduce((sum, v) => sum + getTotalStock(v), 0);
}

export function getStylePriceSpread(variants) {
  const prices = [];
  for (const variant of variants.filter((v) => v.isActive !== false)) {
    for (const row of ensureSizeMatrix(variant)) {
      if (row.price > 0) prices.push(row.price);
    }
  }
  if (!prices.length) return { min: 0, max: 0, from: false };
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max, from: min !== max };
}

/** Collapse colour variants into one card per parentId (style). */
export function dedupeProductsByStyle(products, options = {}) {
  const { preferredColors = [] } = options;
  const groups = new Map();

  for (const product of products) {
    const key = product.parentId || product._id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(product);
  }

  const listings = [];
  for (const variants of groups.values()) {
    const primary = pickPrimaryVariant(variants, { preferredColors });
    if (!primary) continue;

    const minPrice = getStyleMinPrice(variants);
    const oldPrice = getStyleOldPrice(variants, minPrice);
    const totalStock = getStyleTotalStock(variants);
    const priceSpread = getStylePriceSpread(variants);

    listings.push({
      ...primary,
      _id: primary._id,
      name: primary.secondaryName || primary.name,
      price: minPrice,
      oldPrice,
      availableQuantity: totalStock,
      priceFrom: priceSpread.from || variants.length > 1,
    });
  }

  return listings;
}

export function sizeMatrixSummary(product) {
  return ensureSizeMatrix(product)
    .filter((row) => row.qty > 0 || row.price > 0)
    .map((row) => `${row.size}:${row.qty} @ ₹${row.price}`)
    .join(" · ");
}
