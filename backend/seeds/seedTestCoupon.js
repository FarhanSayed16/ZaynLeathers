import "dotenv/config";
import mongoose from "mongoose";
import couponModel from "../models/couponModel.js";

const CODE = "AFIYA10";
const DISCOUNT = 10;

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI missing");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);

  const doc = await couponModel.findOneAndUpdate(
    { code: CODE },
    {
      code: CODE,
      discount: DISCOUNT,
      expiry,
      usageLimit: 0,
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  console.log(`✓ Coupon ${doc.code} — ${doc.discount}% off (expires ${doc.expiry.toISOString().slice(0, 10)})`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
