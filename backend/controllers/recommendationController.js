import { isFeatureEnabled } from "../config/features.js";
import { recommendProducts } from "../utils/recommendations.js";
import productModel from "../models/productModel.js";
import { pickPrimaryVariant } from "../utils/styleListingServer.js";

function dedupeStyleCards(products) {
  const byParent = new Map();
  for (const p of products) {
    const key = String(p.parentId || p._id);
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(p);
  }
  return [...byParent.values()]
    .map((variants) => pickPrimaryVariant(variants))
    .filter(Boolean)
    .map((p) => ({
      ...p,
      name: p.secondaryName || p.name,
    }));
}
function parseIds(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((id) => id.trim()).filter(Boolean);
  }
  return [];
}

export const getRecommendations = async (req, res) => {
  try {
    if (!isFeatureEnabled("recommendations")) {
      return res.json({ success: true, enabled: false, products: [] });
    }

    const productId = req.query.productId || req.body?.productId;
    const extraIds = parseIds(req.query.ids || req.body?.ids);
    const seedIds = [productId, ...extraIds].filter(Boolean);
    const limit = Number(req.query.limit || req.body?.limit || 10);

    if (!seedIds.length) {
      return res.json({ success: false, message: "productId or ids required" });
    }

    const products = await recommendProducts({ seedIds, limit });
    res.json({ success: true, enabled: true, products });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getCartRecommendations = async (req, res) => {
  try {
    if (!isFeatureEnabled("recommendations")) {
      return res.json({ success: true, enabled: false, products: [] });
    }

    const seedIds = parseIds(req.body?.productIds || req.body?.ids);
    const limit = Number(req.body?.limit || 8);
    if (!seedIds.length) {
      return res.json({ success: true, enabled: true, products: [] });
    }

    const products = await recommendProducts({ seedIds, excludeIds: seedIds, limit });
    res.json({ success: true, enabled: true, products });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/** Fallback when there is no seed: bestsellers / featured styles */
export const getDiscoveryRecommendations = async (req, res) => {
  try {
    if (!isFeatureEnabled("recommendations")) {
      return res.json({ success: true, enabled: false, products: [] });
    }

    const seedIds = parseIds(req.query.ids);
    const limit = Number(req.query.limit || 10);

    if (seedIds.length) {
      const products = await recommendProducts({ seedIds, limit });
      if (products.length) {
        return res.json({ success: true, enabled: true, products });
      }
    }

    const featured = await productModel
      .find({ isActive: { $ne: false }, $or: [{ bestseller: true }, { featured: true }] })
      .select("name secondaryName image price oldPrice discount availableQuantity imageAlt parentId isPrimaryListing featured bestseller isActive")
      .sort({ date: -1 })
      .limit(limit * 3)
      .lean();

    res.json({
      success: true,
      enabled: true,
      products: dedupeStyleCards(featured).slice(0, limit),
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
