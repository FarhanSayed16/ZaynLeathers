import express from "express";
import SiteSettings from "../models/SiteSettings.js";
import adminAuth from "../middleware/adminAuth.js";
import brand from "../../shared/brand.config.js";
import {
  clampPartialPercent,
  resolvePartialPaymentConfig,
} from "../utils/partialPayment.js";
import { defaultPolicies, mergePolicies } from "../../shared/defaultPolicies.js";
import { getFeatureFlags } from "../config/features.js";
import { resolveInvoiceConfig } from "../utils/invoicing/invoiceConfig.js";

const router = express.Router();

const DEFAULT_TILES = [
  {
    label: "Men",
    link: "/shop?department=men",
    image: brand.media?.categories?.men || "/brand/categories/men.svg",
    order: 0,
  },
  {
    label: "Women",
    link: "/shop?department=women",
    image: brand.media?.categories?.women || "/brand/categories/women.svg",
    order: 1,
  },
  {
    label: "Bags",
    link: "/shop?department=bags",
    image: brand.media?.categories?.bags || "/brand/categories/bags.svg",
    order: 2,
  },
  {
    label: "Accessories",
    link: "/shop?department=accessories",
    image: brand.media?.categories?.accessories || "/brand/categories/accessories.svg",
    order: 3,
  },
];

const withTileFallbacks = (settings) => {
  const obj = settings.toObject ? settings.toObject() : { ...settings };
  const tiles = obj.categoryTiles?.length ? obj.categoryTiles : DEFAULT_TILES;
  obj.categoryTiles = tiles.map((tile, i) => ({
    ...tile,
    image: tile.image || DEFAULT_TILES[i % DEFAULT_TILES.length].image,
  }));
  return obj;
};

const enrichSettings = async (settings) => {
  const obj = withTileFallbacks(settings);
  const partialPayment = await resolvePartialPaymentConfig();
  obj.policies = mergePolicies(obj.policies);
  const features = getFeatureFlags();
  if (features.invoicing) {
    const inv = await resolveInvoiceConfig();
    obj.invoicePublicConfig = {
      allowCustomerDownloadBeforeDelivered: inv.allowCustomerDownloadBeforeDelivered,
    };
  }
  return { ...obj, partialPaymentConfig: partialPayment, features };
};

// GET settings (Public)
router.get("/", async (req, res) => {
  try {
    let settings = await SiteSettings.findOne({ singleton: "default" });

    if (!settings) {
      settings = await SiteSettings.create({
        singleton: "default",
        categoryTiles: DEFAULT_TILES,
        policies: defaultPolicies(),
      });
    }

    res.json({
      success: true,
      settings: await enrichSettings(settings),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dedicated partial-payment config (storefront convenience)
router.get("/partial-payment", async (_req, res) => {
  try {
    const config = await resolvePartialPaymentConfig();
    res.json({ success: true, ...config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST/Update settings (Admin only)
router.post("/", adminAuth, async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.__v;
    delete updateData.partialPaymentConfig; // computed only

    if (updateData.partialPayment) {
      if (updateData.partialPayment.percent != null) {
        updateData.partialPayment.percent = clampPartialPercent(
          updateData.partialPayment.percent
        );
      }
      if (updateData.partialPayment.minAdvanceAmount != null) {
        const n = Number(updateData.partialPayment.minAdvanceAmount);
        updateData.partialPayment.minAdvanceAmount = Number.isFinite(n)
          ? Math.max(0, Math.round(n))
          : 50;
      }
    }

    if (updateData.policies) {
      updateData.policies = mergePolicies(updateData.policies);
    }

    const settings = await SiteSettings.findOneAndUpdate(
      { singleton: "default" },
      { $set: updateData },
      { returnDocument: "after", upsert: true }
    );

    res.json({
      success: true,
      message: "Settings updated successfully",
      settings: await enrichSettings(settings),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
