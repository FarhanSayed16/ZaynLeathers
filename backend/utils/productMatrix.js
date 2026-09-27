import productModel from "../models/productModel.js";

export const COLOR_OPTIONS = [
  "Black",
  "Brown",
  "Tan",
  "Cognac",
  "Red",
  "White",
  "Green",
  "Blue",
  "Pink",
  "Yellow",
  "Orange",
  "Purple",
  "Cream",
  "Navy",
  "Multi",
];

export function generateParentId() {
  return `style-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeColor(color) {
  if (!color || color === "NotSelected") return "";
  return String(color).trim();
}

export function validateColor(color) {
  const normalized = normalizeColor(color);
  if (!normalized) return { ok: false, message: "Colour is required" };
  if (!COLOR_OPTIONS.includes(normalized)) {
    return {
      ok: false,
      message: `Invalid colour. Choose from: ${COLOR_OPTIONS.join(", ")}`,
    };
  }
  return { ok: true, color: normalized };
}

export function parseSizeMatrixInput(raw, { sizes = ["One Size"], price = 0, oldPrice, qty = 0 } = {}) {
  let parsed = raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Invalid size matrix JSON");
    }
  }

  if (!Array.isArray(parsed) || !parsed.length) {
    const list = Array.isArray(sizes) && sizes.length ? sizes : ["One Size"];
    return list.map((size) => ({
      size: String(size),
      price: Number(price) || 0,
      oldPrice: oldPrice !== undefined && oldPrice !== "" ? Number(oldPrice) : undefined,
      qty: Number(qty) || 0,
    }));
  }

  return parsed.map((row) => ({
    size: String(row.size || "One Size"),
    price: Number(row.price) || 0,
    oldPrice:
      row.oldPrice !== undefined && row.oldPrice !== "" && row.oldPrice !== null
        ? Number(row.oldPrice)
        : undefined,
    qty: Math.max(0, Number(row.qty) || 0),
  }));
}

export function ensureSizeMatrix(product) {
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
  const perSizeQty = Math.floor((Number(product.availableQuantity) || 0) / sizes.length);

  return sizes.map((size, i) => ({
    size: String(size),
    price: Number(product.price) || 0,
    oldPrice: product.oldPrice != null ? Number(product.oldPrice) : undefined,
    qty:
      i === 0
        ? (Number(product.availableQuantity) || 0) - perSizeQty * (sizes.length - 1)
        : perSizeQty,
  }));
}

export function applyLegacyFromMatrix(sizeMatrix) {
  const rows = Array.isArray(sizeMatrix) ? sizeMatrix : [];
  const totalQty = rows.reduce((sum, row) => sum + (Number(row.qty) || 0), 0);
  const prices = rows.map((row) => Number(row.price)).filter((p) => p > 0);
  const oldPrices = rows.map((row) => Number(row.oldPrice)).filter((p) => p > 0);
  const sizes = rows.map((row) => row.size).filter(Boolean);

  return {
    availableQuantity: totalQty,
    price: prices.length ? Math.min(...prices) : 0,
    oldPrice: oldPrices.length ? Math.min(...oldPrices) : undefined,
    sizes: sizes.length ? sizes : ["One Size"],
  };
}

export function validateSizeMatrix(sizeMatrix) {
  if (!Array.isArray(sizeMatrix) || !sizeMatrix.length) {
    return { ok: false, message: "At least one size row is required" };
  }

  for (const row of sizeMatrix) {
    if (!row.size) return { ok: false, message: "Each size row needs a size label" };
    if (Number(row.price) < 0) return { ok: false, message: `Invalid price for size ${row.size}` };
    if (Number(row.qty) < 0) return { ok: false, message: `Invalid quantity for size ${row.size}` };
  }

  return { ok: true };
}

export function getSizeRow(product, size) {
  const matrix = ensureSizeMatrix(product);
  if (!size) return matrix[0];
  return matrix.find((row) => row.size === size) || matrix[0];
}

export function getSizePrice(product, size) {
  const row = getSizeRow(product, size);
  return row ? Number(row.price) : Number(product.price) || 0;
}

export function getSizeOldPrice(product, size) {
  const row = getSizeRow(product, size);
  if (row?.oldPrice != null) return Number(row.oldPrice);
  return product.oldPrice != null ? Number(product.oldPrice) : undefined;
}

export function getSizeQty(product, size) {
  const row = getSizeRow(product, size);
  return row ? Number(row.qty) : Number(product.availableQuantity) || 0;
}

export function hasStock(product, size, quantity = 1) {
  return getSizeQty(product, size) >= quantity;
}

export async function syncRecommendedAcrossSiblings(parentId, recommendedProductIds, excludeId = null) {
  if (!parentId) return;
  const ids = Array.isArray(recommendedProductIds) ? recommendedProductIds : [];
  const filter = { parentId: String(parentId) };
  if (excludeId) filter._id = { $ne: excludeId };
  await productModel.updateMany(filter, { $set: { recommendedProductIds: ids } });
}

export async function syncSecondaryNameAcrossSiblings(parentId, secondaryName, excludeId = null) {
  if (!parentId || !secondaryName) return;
  const filter = { parentId: String(parentId) };
  if (excludeId) filter._id = { $ne: excludeId };
  await productModel.updateMany(filter, { $set: { secondaryName: String(secondaryName).trim() } });
}

async function mutateSizeStock(productId, size, delta) {
  const product = await productModel.findById(productId);
  if (!product) return null;

  const matrix = ensureSizeMatrix(product);
  const idx = matrix.findIndex((row) => row.size === size);
  const targetIdx = idx >= 0 ? idx : 0;
  matrix[targetIdx].qty = Math.max(0, (Number(matrix[targetIdx].qty) || 0) + delta);

  const legacy = applyLegacyFromMatrix(matrix);
  product.sizeMatrix = matrix;
  product.availableQuantity = legacy.availableQuantity;
  product.price = legacy.price;
  product.oldPrice = legacy.oldPrice;
  product.sizes = legacy.sizes;
  await product.save();
  return product;
}

export async function decrementSizeStock(productId, size, quantity) {
  return mutateSizeStock(productId, size, -Math.abs(Number(quantity) || 0));
}

export async function incrementSizeStock(productId, size, quantity) {
  return mutateSizeStock(productId, size, Math.abs(Number(quantity) || 0));
}

export function buildOrderLineFromProduct(product, { size = "", quantity = 1 } = {}) {
  const unitPrice = getSizePrice(product, size);
  return {
    productId: product._id,
    name: product.name,
    price: unitPrice,
    quantity: Number(quantity) || 1,
    size: size || "",
    image: product.image,
    color: product.color || "",
    sku: product.sku || "",
    hsnSac: product.hsnSac || "",
    gstRate: product.gstRate != null ? product.gstRate : null,
    category: product.department || product.category,
    department: product.department || product.category,
    subCategory: product.subCategory || product.categorySlug || "",
    status: "OrderPlaced",
    cancelledBy: null,
  };
}
