/**
 * Backfill deliveredAt for orders that are fully delivered but missing the field.
 * Usage: node backend/scripts/backfillDeliveredAt.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";
import { orderIsFullyDelivered } from "../utils/invoicing/issueInvoiceForOrder.js";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI required");
  process.exit(1);
}

await mongoose.connect(uri);

const orders = await orderModel
  .find({ deliveredAt: null })
  .select("items updatedAt date")
  .lean();

let updated = 0;
for (const o of orders) {
  if (!orderIsFullyDelivered(o)) continue;
  const ts = o.updatedAt || (o.date ? new Date(o.date) : new Date());
  await orderModel.updateOne({ _id: o._id }, { $set: { deliveredAt: ts } });
  updated += 1;
}

console.log(`Backfill complete: ${updated} orders updated (${orders.length} checked without deliveredAt)`);
await mongoose.disconnect();
