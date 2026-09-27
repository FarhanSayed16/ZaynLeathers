import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import { pickPrimaryVariant } from "./styleListingServer.js";

const FBT_TTL_MS = 10 * 60 * 1000;
let fbtCache = { at: 0, map: new Map() };

const PRODUCT_FIELDS =
  "name secondaryName parentId image price oldPrice discount color sku department category subCategory gender tags bestseller featured isActive isPrimaryListing availableQuantity sizeMatrix imageAlt recommendedProductIds";

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function tagSet(product) {
  return new Set((product.tags || []).map(normalize).filter(Boolean));
}

async function loadFbtMap() {
  const now = Date.now();
  if (now - fbtCache.at < FBT_TTL_MS && fbtCache.map.size) return fbtCache.map;

  const orders = await orderModel
    .find({})
    .sort({ date: -1 })
    .limit(800)
    .select("items.productId")
    .lean();

  const map = new Map();
  for (const order of orders) {
    const ids = [
      ...new Set(
        (order.items || [])
          .map((line) => String(line.productId || ""))
          .filter(Boolean)
      ),
    ];
    if (ids.length < 2) continue;
    for (let i = 0; i < ids.length; i += 1) {
      if (!map.has(ids[i])) map.set(ids[i], new Map());
      const inner = map.get(ids[i]);
      for (let j = 0; j < ids.length; j += 1) {
        if (i === j) continue;
        inner.set(ids[j], (inner.get(ids[j]) || 0) + 1);
      }
    }
  }

  fbtCache = { at: now, map };
  return map;
}

function priceBandScore(seed, candidate) {
  const a = Number(seed.price) || 0;
  const b = Number(candidate.price) || 0;
  if (!a || !b) return 0;
  const ratio = Math.abs(a - b) / a;
  if (ratio <= 0.2) return 5;
  if (ratio <= 0.4) return 3;
  if (ratio <= 0.7) return 1;
  return 0;
}

function scoreAgainstSeed(seed, candidate, fbtCount) {
  let score = 0;
  if (candidate.department && candidate.department === seed.department) score += 8;
  if (candidate.category && candidate.category === seed.category) score += 10;
  if (candidate.subCategory && candidate.subCategory === seed.subCategory) score += 12;
  if (candidate.gender && seed.gender && candidate.gender === seed.gender) score += 6;
  if (candidate.color && seed.color && candidate.color === seed.color) score += 4;

  const seedTags = tagSet(seed);
  for (const tag of tagSet(candidate)) {
    if (seedTags.has(tag)) score += 4;
  }

  if (candidate.bestseller) score += 4;
  if (candidate.featured) score += 3;
  if ((Number(candidate.availableQuantity) || 0) > 0) score += 2;
  score += priceBandScore(seed, candidate);
  if (fbtCount > 0) score += Math.min(18, 8 + fbtCount * 2);
  return score;
}

function toCard(product) {
  return {
    _id: product._id,
    name: product.secondaryName || product.name,
    image: product.image,
    price: product.price,
    oldPrice: product.oldPrice,
    discount: product.discount,
    availableQuantity: product.availableQuantity,
    imageAlt: product.imageAlt,
    color: product.color,
    parentId: product.parentId,
    department: product.department,
  };
}

/**
 * Rank other styles for one or more seed products.
 * Colour siblings (same parentId) are excluded — those stay on PDP swatches.
 */
export async function recommendProducts({ seedIds = [], excludeIds = [], limit = 10 } = {}) {
  const uniqueSeeds = [...new Set(seedIds.map(String).filter(Boolean))];
  const exclude = new Set([...uniqueSeeds, ...excludeIds.map(String)]);

  const catalog = await productModel
    .find({ isActive: { $ne: false } })
    .select(PRODUCT_FIELDS)
    .lean();

  const seeds = catalog.filter((p) => uniqueSeeds.includes(String(p._id)));
  if (!seeds.length) return [];

  const excludeParents = new Set(seeds.map((s) => String(s.parentId || s._id)));
  const byId = new Map(catalog.map((p) => [String(p._id), p]));

  const picked = [];
  const usedParents = new Set(excludeParents);
  const manualIds = [];
  for (const seed of seeds) {
    const styleVariants = catalog.filter(
      (p) => String(p.parentId || p._id) === String(seed.parentId || seed._id)
    );
    for (const variant of [seed, ...styleVariants]) {
      for (const raw of variant.recommendedProductIds || []) {
        const id = String(raw);
        if (!manualIds.includes(id)) manualIds.push(id);
      }
    }
  }
  for (const id of manualIds) {
    if (picked.length >= (Number(limit) || 10)) break;
    const product = byId.get(id);
    if (!product || product.isActive === false) continue;
    const parent = String(product.parentId || product._id);
    if (exclude.has(id) || usedParents.has(parent)) continue;
    picked.push(toCard(product));
    usedParents.add(parent);
  }

  const remaining = Math.max(0, (Number(limit) || 10) - picked.length);
  if (!remaining) return picked;

  const fbt = await loadFbtMap();

  const scored = [];
  for (const candidate of catalog) {
    const id = String(candidate._id);
    const parent = String(candidate.parentId || id);
    if (exclude.has(id) || excludeParents.has(parent) || usedParents.has(parent)) continue;

    let best = 0;
    for (const seed of seeds) {
      const seedId = String(seed._id);
      const together = fbt.get(seedId)?.get(id) || 0;
      best = Math.max(best, scoreAgainstSeed(seed, candidate, together));
    }
    if (best <= 0) continue;
    scored.push({ candidate, score: best });
  }

  scored.sort((a, b) => b.score - a.score);

  const byParent = new Map();
  for (const row of scored) {
    const key = String(row.candidate.parentId || row.candidate._id);
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(row.candidate);
  }

  const listings = [];
  for (const variants of byParent.values()) {
    const primary = pickPrimaryVariant(variants);
    if (!primary) continue;
    const match = scored.find((s) => String(s.candidate._id) === String(primary._id));
    listings.push({ product: primary, score: match?.score || 0 });
  }

  listings.sort((a, b) => b.score - a.score);
  const auto = listings.slice(0, remaining).map((row) => toCard(row.product));
  let results = [...picked, ...auto];

  if (results.length < (Number(limit) || 10)) {
    const need = (Number(limit) || 10) - results.length;
    const usedIds = new Set(results.map((p) => String(p._id)));
    const usedStyleKeys = new Set([
      ...usedParents,
      ...results.map((p) => String(p.parentId || p._id)),
    ]);
    const fallback = [];
    for (const candidate of catalog) {
      if (fallback.length >= need) break;
      if (!candidate.bestseller && !candidate.featured) continue;
      const id = String(candidate._id);
      const parent = String(candidate.parentId || id);
      if (exclude.has(id) || usedIds.has(id) || usedStyleKeys.has(parent)) continue;
      fallback.push(toCard(candidate));
      usedIds.add(id);
      usedStyleKeys.add(parent);
    }
    results = [...results, ...fallback];
  }

  return results.slice(0, Number(limit) || 10);
}
