export function ensureSizeMatrix(product) {
  if (!product) return [];
  if (Array.isArray(product.sizeMatrix) && product.sizeMatrix.length) {
    return product.sizeMatrix.map((row) => ({
      size: String(row.size),
      price: Number(row.price) || 0,
      oldPrice: row.oldPrice != null ? Number(row.oldPrice) : undefined,
      qty: Math.max(0, Number(row.qty) || 0),
    }));
  }

  const sizes =
    Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ["One Size"];

  return sizes.map((size) => ({
    size: String(size),
    price: Number(product.price) || 0,
    oldPrice: product.oldPrice != null ? Number(product.oldPrice) : undefined,
    qty: Number(product.availableQuantity) || 0,
  }));
}

export function getSizeRow(product, size) {
  const matrix = ensureSizeMatrix(product);
  if (!size) return matrix[0];
  return matrix.find((row) => row.size === size) || matrix[0];
}

export function getSizePrice(product, size) {
  const row = getSizeRow(product, size);
  return row ? Number(row.price) : Number(product?.price) || 0;
}

export function getSizeOldPrice(product, size) {
  const row = getSizeRow(product, size);
  if (row?.oldPrice != null) return Number(row.oldPrice);
  return product?.oldPrice != null ? Number(product.oldPrice) : undefined;
}

export function getSizeQty(product, size) {
  const row = getSizeRow(product, size);
  return row ? Number(row.qty) : Number(product?.availableQuantity) || 0;
}

export function getTotalStock(product) {
  return ensureSizeMatrix(product).reduce((sum, row) => sum + row.qty, 0);
}

export function isSizeInStock(product, size) {
  return getSizeQty(product, size) > 0;
}

export function getDisplayPrice(product, size) {
  if (size) return getSizePrice(product, size);
  const matrix = ensureSizeMatrix(product);
  const prices = matrix.map((row) => row.price).filter((p) => p > 0);
  return prices.length ? Math.min(...prices) : Number(product?.price) || 0;
}

export function getDisplayOldPrice(product, size) {
  if (size) {
    const old = getSizeOldPrice(product, size);
    const current = getSizePrice(product, size);
    return old != null && old > current ? old : undefined;
  }
  const matrix = ensureSizeMatrix(product);
  const oldPrices = matrix.map((row) => row.oldPrice).filter((p) => p != null && p > 0);
  const minOld = oldPrices.length ? Math.min(...oldPrices) : undefined;
  const minPrice = getDisplayPrice(product);
  return minOld != null && minOld > minPrice ? minOld : undefined;
}
