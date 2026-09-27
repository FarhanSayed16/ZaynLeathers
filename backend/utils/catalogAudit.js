import productModel from "../models/productModel.js";
import {
  ensureSizeMatrix,
  applyLegacyFromMatrix,
  normalizeColor,
  syncSecondaryNameAcrossSiblings,
} from "./productMatrix.js";

function groupByParentId(products) {
  const map = new Map();
  for (const product of products) {
    const key = String(product.parentId || "");
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(product);
  }
  return map;
}

export async function runCatalogAudit() {
  const products = await productModel.find({}).lean();
  const issues = [];
  const byParent = groupByParentId(products);

  for (const product of products) {
    if (!product.parentId) {
      issues.push({
        id: `missing-parent-${product._id}`,
        type: "missing_parent_id",
        severity: "error",
        productId: String(product._id),
        name: product.name,
        message: `"${product.name}" has no parentId (style group)`,
      });
    }

    if (!Array.isArray(product.sizeMatrix) || !product.sizeMatrix.length) {
      issues.push({
        id: `missing-matrix-${product._id}`,
        type: "missing_matrix",
        severity: "warning",
        productId: String(product._id),
        parentId: product.parentId,
        name: product.name,
        message: `"${product.name}" (${product.color || "no colour"}) has no size matrix`,
        fixable: true,
        fix: { type: "bootstrap_matrix", productId: String(product._id) },
      });
    }
  }

  for (const [parentId, variants] of byParent.entries()) {
    if (!parentId) continue;

    const activeVariants = variants.filter((v) => v.isActive !== false);
    const colorMap = new Map();

    for (const variant of variants) {
      const color = normalizeColor(variant.color);
      if (!color) {
        issues.push({
          id: `missing-color-${variant._id}`,
          type: "missing_color",
          severity: "error",
          productId: String(variant._id),
          parentId,
          name: variant.name,
          message: `"${variant.name}" is missing a colour`,
        });
        continue;
      }
      if (!colorMap.has(color)) colorMap.set(color, []);
      colorMap.get(color).push(variant);
    }

    for (const [color, dupes] of colorMap.entries()) {
      if (dupes.length > 1) {
        issues.push({
          id: `duplicate-color-${parentId}-${color}`,
          type: "duplicate_color",
          severity: "error",
          parentId,
          color,
          count: dupes.length,
          productIds: dupes.map((d) => String(d._id)),
          message: `Style ${parentId} has ${dupes.length} variants for colour ${color}`,
        });
      }
    }

    const secondaryNames = [...new Set(variants.map((v) => v.secondaryName).filter(Boolean))];
    if (secondaryNames.length > 1) {
      issues.push({
        id: `secondary-mismatch-${parentId}`,
        type: "secondary_name_mismatch",
        severity: "warning",
        parentId,
        names: secondaryNames,
        message: `Style ${parentId} has mismatched secondary names: ${secondaryNames.join(" / ")}`,
        fixable: true,
        fix: { type: "sync_secondary_name", parentId },
      });
    }

    if (activeVariants.length >= 1) {
      const primaries = activeVariants.filter((v) => v.isPrimaryListing);
      if (primaries.length === 0) {
        issues.push({
          id: `no-primary-${parentId}`,
          type: "no_primary_listing",
          severity: "warning",
          parentId,
          message: `Style ${parentId} has no primary shop listing colour`,
          fixable: true,
          fix: { type: "set_primary_listing", parentId },
        });
      } else if (primaries.length > 1) {
        issues.push({
          id: `multi-primary-${parentId}`,
          type: "multiple_primary_listing",
          severity: "error",
          parentId,
          count: primaries.length,
          productIds: primaries.map((p) => String(p._id)),
          message: `Style ${parentId} has ${primaries.length} active primary listings`,
          fixable: true,
          fix: { type: "set_primary_listing", parentId },
        });
      }
    }
  }

  for (const product of products) {
    if (!Array.isArray(product.sizeMatrix) || !product.sizeMatrix.length) continue;
    const matrixQty = product.sizeMatrix.reduce((s, r) => s + (Number(r.qty) || 0), 0);
    const legacyQty = Number(product.availableQuantity) || 0;
    if (Math.abs(matrixQty - legacyQty) > 0) {
      issues.push({
        id: `matrix-drift-${product._id}`,
        type: "matrix_legacy_drift",
        severity: "warning",
        productId: String(product._id),
        parentId: product.parentId,
        name: product.name,
        message: `"${product.name}" matrix total (${matrixQty}) ≠ legacy stock (${legacyQty})`,
        fixable: true,
        fix: { type: "bootstrap_matrix", productId: String(product._id) },
      });
    }
  }

  const styleCount = [...byParent.keys()].filter(Boolean).length;

  const summary = {
    total: issues.length,
    errors: issues.filter((i) => i.severity === "error").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
    fixable: issues.filter((i) => i.fixable).length,
    styles: styleCount,
    products: products.length,
  };

  return { issues, summary };
}

async function bootstrapProductMatrix(productId) {
  const product = await productModel.findById(productId);
  if (!product) return { ok: false, message: "Product not found" };

  const matrix = ensureSizeMatrix(product);
  const legacy = applyLegacyFromMatrix(matrix);
  product.sizeMatrix = matrix;
  product.availableQuantity = legacy.availableQuantity;
  product.price = legacy.price;
  product.oldPrice = legacy.oldPrice;
  product.sizes = legacy.sizes;
  await product.save();
  return { ok: true, productId: String(product._id), name: product.name };
}

async function syncSecondaryNameForStyle(parentId) {
  const variants = await productModel.find({ parentId: String(parentId) }).sort({ date: 1 });
  if (!variants.length) return { ok: false, message: "Style not found" };

  const source =
    variants.find((v) => v.isPrimaryListing) ||
    variants.find((v) => v.isActive !== false) ||
    variants[0];
  const name = source.secondaryName || source.name;
  await syncSecondaryNameAcrossSiblings(parentId, name);
  return { ok: true, parentId, secondaryName: name, updated: variants.length };
}

async function setPrimaryListingForStyle(parentId) {
  const variants = await productModel.find({ parentId: String(parentId) }).sort({ date: 1 });
  if (!variants.length) return { ok: false, message: "Style not found" };

  const pick =
    variants.find((v) => v.isPrimaryListing && v.isActive !== false) ||
    variants.find((v) => v.isActive !== false) ||
    variants[0];

  await productModel.updateMany({ parentId: String(parentId) }, { isPrimaryListing: false });
  pick.isPrimaryListing = true;
  await pick.save();

  return {
    ok: true,
    parentId,
    productId: String(pick._id),
    color: pick.color,
  };
}

export async function applyCatalogFix(fix) {
  if (!fix?.type) return { ok: false, message: "Fix type is required" };

  switch (fix.type) {
    case "bootstrap_matrix":
      return bootstrapProductMatrix(fix.productId);
    case "sync_secondary_name":
      return syncSecondaryNameForStyle(fix.parentId);
    case "set_primary_listing":
      return setPrimaryListingForStyle(fix.parentId);
    default:
      return { ok: false, message: `Unknown fix type: ${fix.type}` };
  }
}

export async function applyAllCatalogFixes(issues = []) {
  const seen = new Set();
  const results = [];

  for (const issue of issues) {
    if (!issue.fixable || !issue.fix) continue;
    const key = JSON.stringify(issue.fix);
    if (seen.has(key)) continue;
    seen.add(key);
    const result = await applyCatalogFix(issue.fix);
    results.push({ fix: issue.fix, ...result });
  }

  return results;
}

export async function autoFixStyle(parentId) {
  const { issues } = await runCatalogAudit();
  const styleIssues = issues.filter((i) => i.parentId === parentId && i.fixable);
  return applyAllCatalogFixes(styleIssues);
}
