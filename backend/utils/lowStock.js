import productModel from "../models/productModel.js";
import { ensureSizeMatrix } from "./productMatrix.js";

export function getLowStockThreshold() {
  const n = Number(process.env.LOW_STOCK_THRESHOLD);
  return Number.isFinite(n) && n >= 0 ? n : 3;
}

function rowPayload(product, size, qty) {
  return {
    productId: String(product._id),
    name: product.name,
    color: product.color || "",
    size,
    qty,
    department: product.department || "",
    sku: product.sku || "",
    editPath: `/editProduct/${product._id}`,
  };
}

export async function scanLowStock({ threshold, limit = 20 } = {}) {
  const t = threshold ?? getLowStockThreshold();
  const max = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const products = await productModel
    .find({ isActive: { $ne: false } })
    .select("name color sku department availableQuantity sizeMatrix sizes")
    .lean();

  const critical = [];
  const low = [];

  for (const product of products) {
    const hasMatrix = Array.isArray(product.sizeMatrix) && product.sizeMatrix.length > 0;

    if (hasMatrix) {
      const matrix = ensureSizeMatrix(product);
      let allZero = matrix.length > 0;

      for (const row of matrix) {
        const qty = Math.max(0, Number(row.qty) || 0);
        if (qty > 0) allZero = false;
        if (qty > 0 && qty <= t) {
          low.push(rowPayload(product, row.size, qty));
        }
      }

      if (allZero && matrix.length) {
        critical.push(
          rowPayload(
            product,
            matrix.length === 1 ? matrix[0].size : "All sizes",
            0
          )
        );
      }
    } else {
      const qty = Math.max(0, Number(product.availableQuantity) || 0);
      const size =
        Array.isArray(product.sizes) && product.sizes.length === 1
          ? product.sizes[0]
          : "One Size";

      if (qty === 0) {
        critical.push(rowPayload(product, size, 0));
      } else if (qty <= t) {
        low.push(rowPayload(product, size, qty));
      }
    }
  }

  low.sort((a, b) => a.qty - b.qty || a.name.localeCompare(b.name));
  critical.sort((a, b) => a.name.localeCompare(b.name));

  return {
    critical: critical.slice(0, max),
    low: low.slice(0, max),
    totalLowSkus: low.length,
    totalOutSkus: critical.length,
    threshold: t,
  };
}
