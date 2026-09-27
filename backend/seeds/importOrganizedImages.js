/**
 * Import organized_images/ → Cloudinary + Mongo products
 *
 * Usage:
 *   node seeds/importOrganizedImages.js
 *   node seeds/importOrganizedImages.js --limit=20
 *   node seeds/importOrganizedImages.js --wipe
 *   node seeds/importOrganizedImages.js --skip-upload   (reuse URLs if re-run with local skip — not typical)
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Category from "../models/Category.js";
import productModel from "../models/productModel.js";
import HeroBanner from "../models/HeroBanner.js";
import SiteSettings from "../models/SiteSettings.js";
import InstagramPromo from "../models/InstagramPromo.js";
import brand from "../../shared/brand.config.js";
import { slugify } from "../utils/categoryHelpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const IMAGES_DIR = path.join(ROOT, "organized_images");

const CLOUD_ROOT =
  process.env.CLOUDINARY_FOLDER ||
  brand.commerce?.cloudinaryFolder ||
  "afiya-leathers";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function parseArgs() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  return {
    wipe: args.includes("--wipe"),
    limit: limitArg ? Number(limitArg.split("=")[1]) : 0,
    dryRun: args.includes("--dry-run"),
  };
}

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
    .map((f) => path.join(dir, f))
    .sort();
}

function guessColor(name) {
  const n = name.toLowerCase();
  const colors = [
    "black",
    "brown",
    "tan",
    "beige",
    "blue",
    "red",
    "green",
    "olive",
    "white",
    "gray",
    "grey",
    "purple",
    "burgundy",
    "yellow",
    "pink",
    "navy",
    "cream",
  ];
  for (const c of colors) {
    if (n.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
  }
  return "Brown";
}

function cleanTitle(folderName) {
  return folderName
    .replace(/Men8217s|Women8217s|8217/g, (m) =>
      m.includes("Women") ? "Women's" : m.includes("Men") ? "Men's" : "'"
    )
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Map folder name → { department, leafSlugHint, gender, tags, sizes, apparel }
 */
function mapFolder(folderName) {
  const n = folderName.toLowerCase().replace(/8217/g, "'");
  const tags = ["imported"];
  let gender = "";
  const isWomen = /\bwomen\b|\bwoman\b|\bladies\b|\bgirls\b/.test(n);
  const isMen = (/\bmen\b|\bmens\b|\bman's\b|\bmen's\b/.test(n) || /\bmen\b/.test(n)) && !isWomen;
  if (isWomen) gender = "women";
  else if (isMen) gender = "men";

  const apparelSizes = ["S", "M", "L", "XL", "XXL"];
  const oneSize = ["One Size"];

  // Accessories
  if (/\btie\b|\bwallet\b|\bbelt\b|\bglove\b|\bkeychain\b|\bcard holder\b|\bpassport\b/.test(n)) {
    let leaf = "accessories-leather-accessories";
    if (/\bwallet\b/.test(n)) leaf = "accessories-wallets";
    else if (/\bbelt\b/.test(n)) leaf = "accessories-belts";
    else if (/\bglove\b/.test(n)) leaf = "accessories-gloves";
    else if (/\bkeychain\b/.test(n)) leaf = "accessories-keychains";
    else if (/\btie\b/.test(n)) leaf = "accessories-leather-accessories";
    return {
      department: "accessories",
      leafSlug: leaf,
      gender: gender || "unisex",
      tags,
      sizes: oneSize,
      material: /pu/.test(n) ? "PU Leather" : "Genuine Leather",
    };
  }

  // Bags — seeded slugs: mens-bags-*, womens-bags-*
  const isBag =
    /\bbag\b|\bbackpack\b|\bsling\b|\btote\b|\thandbag\b|\bsatchel\b|\bmessenger\b|\blaptop\b|\boffice bag\b|\bbriefcase\b|\bpurse\b/.test(
      n
    ) && !/\bjacket\b|\bblazer\b|\bpant\b|\bdress\b|\bshirt\b/.test(n);

  if (isBag) {
    const womenBag = isWomen || /\bladies\b|\thandbag\b|\btote\b/.test(n);
    const deptGender = womenBag ? "women" : "men";
    const prefix = womenBag ? "womens-bags" : "mens-bags";
    let leaf = womenBag ? `${prefix}-handbags` : `${prefix}-office-bags`;
    if (/\bsling\b/.test(n)) leaf = `${prefix}-sling-bags`;
    else if (/\bbackpack\b/.test(n)) leaf = `${prefix}-backpacks`;
    else if (/\blaptop\b|\boffice\b|\bbriefcase\b/.test(n)) leaf = `${prefix}-laptop-bags`;
    else if (/\bmessenger\b/.test(n)) leaf = "mens-bags-messenger-bags";
    else if (/\btote\b/.test(n)) leaf = "womens-bags-tote-bags";
    else if (/\bsatchel\b/.test(n)) leaf = "womens-bags-satchel-bags";
    else if (/\thandbag\b/.test(n)) leaf = "womens-bags-handbags";
    return {
      department: "bags",
      leafSlug: leaf,
      gender: gender || deptGender,
      tags,
      sizes: oneSize,
      material: /croco|croc/.test(n) ? "Croco" : /suede/.test(n) ? "Suede" : "Genuine Leather",
    };
  }

  // Apparel
  const g = gender || (isWomen ? "women" : "men");
  const prefix = g === "women" ? "women" : "men";

  if (/\bdress\b/.test(n)) {
    return {
      department: g === "women" ? "women" : "women",
      leafSlug: "women-leather-dresses",
      gender: "women",
      tags,
      sizes: apparelSizes,
      material: /suede/.test(n) ? "Suede" : "Lambskin",
    };
  }
  if (/\bskirt\b/.test(n)) {
    return {
      department: "women",
      leafSlug: "women-leather-skirts",
      gender: "women",
      tags,
      sizes: apparelSizes,
      material: /suede/.test(n) ? "Suede" : "Lambskin",
    };
  }
  if (/\bpant\b|\btrouser\b/.test(n)) {
    return {
      department: prefix,
      leafSlug: `${prefix}-leather-pants`,
      gender: g === "women" ? "women" : "men",
      tags,
      sizes: apparelSizes,
      material: "Lambskin",
    };
  }
  if (/\bshort\b|\bboxer\b/.test(n)) {
    return {
      department: prefix,
      leafSlug: `${prefix}-leather-shorts`,
      gender: g === "women" ? "women" : "men",
      tags,
      sizes: apparelSizes,
      material: "Lambskin",
    };
  }
  if (/\btrench\b|\btreach\b|\bover coat\b|\bovercoat\b/.test(n)) {
    return {
      department: prefix,
      leafSlug: `${prefix}-leather-trench-coats`,
      gender: g === "women" ? "women" : "men",
      tags,
      sizes: apparelSizes,
      material: "Lambskin",
    };
  }
  if (/\bblazer\b|\bcoat\b/.test(n) && !/\bjacket\b/.test(n)) {
    return {
      department: prefix,
      leafSlug: `${prefix}-leather-blazers`,
      gender: g === "women" ? "women" : "men",
      tags,
      sizes: apparelSizes,
      material: /suede/.test(n) ? "Suede" : "Lambskin",
    };
  }
  if (/\bshirt\b/.test(n)) {
    return {
      department: prefix,
      leafSlug: `${prefix}-leather-shirts`,
      gender: g === "women" ? "women" : "men",
      tags,
      sizes: apparelSizes,
      material: /suede/.test(n) ? "Suede" : "Lambskin",
    };
  }
  if (/\bvest\b/.test(n)) {
    return {
      department: prefix,
      leafSlug: `${prefix}-leather-vest-coats`,
      gender: g === "women" ? "women" : "men",
      tags,
      sizes: apparelSizes,
      material: "Lambskin",
    };
  }
  if (/\bsuede\b/.test(n) && (/\bjacket\b|\bbiker\b|\bbomber\b|\bmotorcycle\b/.test(n) || true)) {
    if (/\bjacket\b|\bbiker\b|\bbomber\b|\bmotorcycle\b|\bracer\b/.test(n) || /\bsuede\b/.test(n)) {
      return {
        department: prefix,
        leafSlug: `${prefix}-suede-jackets`,
        gender: g === "women" ? "women" : "men",
        tags: [...tags, "suede"],
        sizes: apparelSizes,
        material: "Suede",
      };
    }
  }
  if (/\bjacket\b|\bbiker\b|\bbomber\b|\bmotorcycle\b|\bracer\b/.test(n)) {
    return {
      department: prefix,
      leafSlug: `${prefix}-leather-jackets`,
      gender: g === "women" ? "women" : "men",
      tags,
      sizes: apparelSizes,
      material: /lambskin|lamb/.test(n) ? "Lambskin" : "Genuine Leather",
    };
  }

  // Fallback
  tags.push("needs-review");
  return {
    department: prefix,
    leafSlug: `${prefix}-leather-jackets`,
    gender: g === "women" ? "women" : "men",
    tags,
    sizes: apparelSizes,
    material: "Genuine Leather",
  };
}

function randomPrice(department) {
  if (department === "accessories") return 999 + Math.floor(Math.random() * 2000);
  if (department === "bags") return 2499 + Math.floor(Math.random() * 5000);
  return 4999 + Math.floor(Math.random() * 10000);
}

async function uploadFile(filePath, folder) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });
  return result.secure_url;
}

async function mapPool(items, concurrency, fn) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

async function seedHomepage({ categoriesBySlug, sampleProductImages }) {
  const heroes = [
    {
      sequence: 1,
      title: "Leather jackets",
      subtitle: "Built for the road and the city",
      ctaLabel: "Shop jackets",
      ctaLink: "/shop?department=men",
      local: path.join(ROOT, "frontend/public/brand/heroes/hero-1.webp"),
    },
    {
      sequence: 2,
      title: "For her",
      subtitle: "Biker silhouettes in real leather",
      ctaLabel: "Shop women",
      ctaLink: "/shop?department=women",
      local: path.join(ROOT, "frontend/public/brand/heroes/hero-2.jpg"),
    },
    {
      sequence: 3,
      title: "Leather bags",
      subtitle: "Handbags, totes, and everyday carries",
      ctaLabel: "Shop bags",
      ctaLink: "/shop?department=bags",
      local: path.join(ROOT, "frontend/public/brand/heroes/hero-3.webp"),
    },
    {
      sequence: 4,
      title: "Work-ready leather",
      subtitle: "Laptop and office bags with presence",
      ctaLabel: "Shop all",
      ctaLink: "/shop",
      local: path.join(ROOT, "frontend/public/brand/heroes/hero-4.webp"),
    },
  ];

  for (const h of heroes) {
    let imageUrl = brand.media.heroes?.[h.sequence - 1]?.image || "";
    if (fs.existsSync(h.local)) {
      try {
        imageUrl = await uploadFile(h.local, `${CLOUD_ROOT}/heroes`);
      } catch (e) {
        console.warn("Hero upload failed, using local path", h.sequence, e.message);
        imageUrl = `/brand/heroes/${path.basename(h.local)}`;
      }
    }
    await HeroBanner.findOneAndUpdate(
      { sequence: h.sequence },
      {
        image: imageUrl,
        title: h.title,
        subtitle: h.subtitle,
        ctaLabel: h.ctaLabel,
        ctaLink: h.ctaLink,
        sequence: h.sequence,
        isActive: true,
      },
      { upsert: true, returnDocument: "after" }
    );
    console.log(`  hero ${h.sequence} ready`);
  }

  const tileDefs = [
    { label: "Men", link: "/shop?department=men", image: "/brand/categories/men.jpg", order: 0 },
    { label: "Women", link: "/shop?department=women", image: "/brand/categories/women.jpg", order: 1 },
    { label: "Bags", link: "/shop?department=bags", image: "/brand/categories/bags.jpg", order: 2 },
    { label: "Accessories", link: "/shop?department=accessories", image: "/brand/categories/accessories.jpg", order: 3 },
  ];

  await SiteSettings.findOneAndUpdate(
    { singleton: "default" },
    {
      singleton: "default",
      deliveryFee: brand.commerce?.deliveryFee ?? 50,
      freeShippingThreshold: 999,
      codEnabled: true,
      homeConfig: {
        showHero: true,
        showCategories: true,
        showNewArrivals: true,
        showBestSellers: true,
        showInstagram: true,
        showReviews: false,
        newArrivalsTitle: "NEW ARRIVALS",
        bestSellersTitle: "BEST SELLERS",
        featuredProductIds: [],
      },
      categoryTiles: tileDefs,
      promoStrip: {
        isActive: true,
        message: "FREE SHIPPING ON ORDERS OVER ₹999 — ZAYN LEATHERS",
        link: "/shop",
      },
    },
    { upsert: true, returnDocument: "after" }
  );
  console.log("  site settings updated");

  // Instagram fallbacks from sample images (up to 6)
  const igSamples = (sampleProductImages || []).slice(0, 6);
  if (igSamples.length) {
    await InstagramPromo.deleteMany({});
    for (let i = 0; i < igSamples.length; i++) {
      await InstagramPromo.create({
        image: igSamples[i],
        caption: brand.shortName,
        instagramLink: brand.social?.instagram || "https://instagram.com/",
        productLink: "/shop",
        sequence: i + 1,
        isActive: true,
      });
    }
    console.log(`  ${igSamples.length} instagram promos`);
  }
}

async function main() {
  const { wipe, limit, dryRun } = parseArgs();

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error("organized_images not found at", IMAGES_DIR);
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
  });

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Mongo connected");

  if (wipe) {
    await productModel.deleteMany({});
    console.log("Wiped products");
  }

  const allCats = await Category.find({}).lean();
  const categoriesBySlug = new Map(allCats.map((c) => [c.slug, c]));
  console.log(`Categories loaded: ${allCats.length}`);

  let folders = fs
    .readdirSync(IMAGES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  if (limit > 0) folders = folders.slice(0, limit);
  console.log(`Importing ${folders.length} product folders…`);

  const sampleIg = [];
  let ok = 0;
  let fail = 0;

  await mapPool(folders, 3, async (folderName, idx) => {
    try {
      const folderPath = path.join(IMAGES_DIR, folderName);
      const images = listImages(folderPath);
      if (!images.length) {
        console.warn(`  skip (no images): ${folderName}`);
        fail++;
        return;
      }

      const mapped = mapFolder(folderName);
      let leaf = categoriesBySlug.get(mapped.leafSlug);
      if (!leaf) {
        leaf = allCats.find(
          (c) =>
            c.type === "category" &&
            (c.slug === mapped.leafSlug ||
              c.slug.endsWith(mapped.leafSlug.split("-").slice(-2).join("-")))
        );
      }
      if (!leaf) {
        const fallbackSlug =
          mapped.department === "bags"
            ? "mens-bags-office-bags"
            : mapped.department === "accessories"
              ? "accessories-leather-accessories"
              : mapped.department === "women"
                ? "women-leather-jackets"
                : "men-leather-jackets";
        leaf = categoriesBySlug.get(fallbackSlug);
      }
      if (!leaf) {
        console.warn(`  no category for ${folderName} → ${mapped.leafSlug}`);
        mapped.tags.push("needs-review");
      }

      const title = cleanTitle(folderName);
      const color = guessColor(folderName);
      const price = randomPrice(mapped.department);
      const oldPrice = Math.round(price * 1.18);
      const parentId = `af-${slugify(folderName).slice(0, 40)}-${idx}`;

      if (dryRun) {
        console.log(`[dry] ${title} → ${mapped.leafSlug} (${images.length} imgs)`);
        ok++;
        return;
      }

      // Cap images per product
      const toUpload = images.slice(0, 4);
      const urls = [];
      for (const img of toUpload) {
        const url = await uploadFile(img, `${CLOUD_ROOT}/products/${slugify(folderName).slice(0, 50)}`);
        urls.push(url);
      }

      if (sampleIg.length < 6 && urls[0]) sampleIg.push(urls[0]);

      const isBestseller = idx % 12 === 0;
      const isFeatured = idx % 15 === 0;
      const tags = [...mapped.tags];
      if (idx < 20) tags.push("new-arrivals");
      if (isBestseller) tags.push("best-sellers");

      const dept = leaf
        ? // resolve department from path
          leaf.path?.split("/")[0] || mapped.department
        : mapped.department;

      await productModel.findOneAndUpdate(
        { parentId, color },
        {
          name: title,
          secondaryName: title,
          parentId,
          description: `${title}. Crafted in ${mapped.material}. Part of the Zayn Leathers collection — designed to be worn often and kept longer.`,
          price,
          oldPrice,
          discount: Math.round(((oldPrice - price) / oldPrice) * 100),
          image: urls,
          viewsizeimage: [],
          department: dept,
          categoryId: leaf?._id,
          categorySlug: leaf?.slug || mapped.leafSlug,
          category: leaf?.name || mapped.leafSlug,
          subCategory: leaf?.name || "",
          gender: mapped.gender || leaf?.gender || "",
          material: mapped.material,
          dimensions: "",
          availableQuantity: 25 + (idx % 40),
          sizes: mapped.sizes,
          bestseller: isBestseller,
          featured: isFeatured,
          tags,
          color,
          date: Date.now() - idx * 60000,
          status: "",
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );

      ok++;
      if ((idx + 1) % 10 === 0 || idx === 0) {
        console.log(`  [${idx + 1}/${folders.length}] ${title}`);
      }
    } catch (err) {
      fail++;
      console.error(`  FAIL ${folderName}:`, err.message);
    }
  });

  console.log(`\nProducts: ${ok} ok, ${fail} failed`);

  if (!dryRun) {
    console.log("Seeding homepage (heroes, settings, instagram)…");
    await seedHomepage({ categoriesBySlug, sampleProductImages: sampleIg });
  }

  const total = await productModel.countDocuments();
  console.log(`Done. Products in DB: ${total}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
