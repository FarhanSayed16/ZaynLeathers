/**
 * One-time migration: populate sizeMatrix from legacy price / availableQuantity / sizes.
 * Run from backend/: node scripts/migrateSizeMatrix.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import productModel from "../models/productModel.js";
import { ensureSizeMatrix, applyLegacyFromMatrix } from "../utils/productMatrix.js";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await productModel.find({
    $or: [{ sizeMatrix: { $exists: false } }, { sizeMatrix: { $size: 0 } }],
  });

  let updated = 0;
  for (const product of products) {
    const matrix = ensureSizeMatrix(product);
    const legacy = applyLegacyFromMatrix(matrix);
    product.sizeMatrix = matrix;
    product.availableQuantity = legacy.availableQuantity;
    product.price = legacy.price;
    product.oldPrice = legacy.oldPrice;
    product.sizes = legacy.sizes;
    await product.save();
    updated += 1;
  }

  console.log(`Migrated ${updated} product(s) to sizeMatrix.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
