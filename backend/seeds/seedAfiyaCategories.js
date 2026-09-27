import "dotenv/config";
import mongoose from "mongoose";
import Category from "../models/Category.js";
import { AFIYA_CATEGORY_TREE } from "./afiyaCategoryTree.js";
import { slugify } from "../utils/categoryHelpers.js";

async function insertNode(node, parent = null, orderIndex = 0) {
  const nameSlug = slugify(node.name);
  let finalSlug;

  if (!parent) {
    finalSlug = node.slug || nameSlug;
  } else if (node.slug) {
    finalSlug = node.slug.includes(parent.slug) ? node.slug : `${parent.slug}-${node.slug}`;
  } else {
    finalSlug = `${parent.slug}-${nameSlug}`;
  }

  const cleanPath = parent ? `${parent.path}/${nameSlug}` : finalSlug;

  const doc = await Category.findOneAndUpdate(
    { slug: finalSlug },
    {
      name: node.name,
      slug: finalSlug,
      type: node.type || (parent ? "category" : "department"),
      parentId: parent?._id || null,
      path: cleanPath,
      gender: node.gender ?? parent?.gender ?? null,
      order: node.order ?? orderIndex,
      isActive: true,
      showInNav: node.showInNav !== false,
      showInShop: node.showInShop !== false,
      image: node.image || "",
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  const children = node.children || [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (typeof child === "string") {
      await insertNode(
        {
          name: child,
          type: "category",
          gender: node.gender ?? parent?.gender ?? null,
          order: i + 1,
        },
        doc,
        i + 1
      );
    } else {
      await insertNode({ ...child, order: child.order ?? i + 1 }, doc, i + 1);
    }
  }

  return doc;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI missing");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected:", uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@"));

  if (process.argv.includes("--wipe")) {
    await Category.deleteMany({});
    console.log("Wiped existing categories");
  }

  for (const dept of AFIYA_CATEGORY_TREE) {
    await insertNode(dept);
    console.log("✓", dept.name);
  }

  const count = await Category.countDocuments();
  console.log(`Done. ${count} categories in tree.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
