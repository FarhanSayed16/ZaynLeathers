import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import userModel from "../models/userModel.js";

const TEST_USERS = [
  {
    firstName: "Test",
    lastName: "Customer",
    email: "customer@test.com",
    phone: "9999990001",
    password: "Test@1234",
  },
  {
    firstName: "Buyer",
    lastName: "Afiya",
    email: "buyer@afiya.test",
    phone: "9999990002",
    password: "Test@1234",
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI missing");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected");

  for (const u of TEST_USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    const doc = await userModel.findOneAndUpdate(
      { email: u.email.toLowerCase() },
      {
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email.toLowerCase(),
        phone: u.phone,
        password: hashed,
        isVerified: true,
        otp: undefined,
        otpExpires: undefined,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`✓ ${doc.email} (password: ${u.password})`);
  }

  console.log("\nAdmin login (from .env):");
  console.log(`  ${process.env.ADMIN_EMAIL || "admin@afiyaleathers.com"}`);
  console.log("  (ADMIN_PASSWORD in backend/.env)");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
