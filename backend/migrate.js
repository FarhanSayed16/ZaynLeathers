import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const OLD_MONGO_URI = process.env.MONGODB_URI;
const NEW_MONGO_URI = "mongodb://essentialdc8_db_user:4DTBSdpLa1hwls5C@ac-hnnpv6q-shard-00-00.4beaorv.mongodb.net:27017,ac-hnnpv6q-shard-00-01.4beaorv.mongodb.net:27017,ac-hnnpv6q-shard-00-02.4beaorv.mongodb.net:27017/afiyaleathers?ssl=true&replicaSet=atlas-tbqho8-shard-0&authSource=admin&appName=AfiyaLeathers";

cloudinary.config({
  cloud_name: "h7zr7bhn",
  api_key: "618178133189694",
  api_secret: "At0v7xK-erCyElGDJC1VRtd7xKk",
});

async function run() {
  console.log("Connecting to Old DB...");
  const oldDb = await mongoose.createConnection(OLD_MONGO_URI).asPromise();
  
  console.log("Connecting to New DB...");
  const newDb = await mongoose.createConnection(NEW_MONGO_URI).asPromise();

  // Define minimal schemas to read/write all data as generic documents (strict: false)
  const GenericSchema = new mongoose.Schema({}, { strict: false, timestamps: false, versionKey: false });

  const collections = ["users", "products", "orders", "coupons", "reviews"];

  for (const coll of collections) {
    console.log(`\n--- Migrating Collection: ${coll} ---`);
    const OldModel = oldDb.model(coll, GenericSchema, coll);
    const NewModel = newDb.model(coll, GenericSchema, coll);

    // Clear new collection just in case
    await NewModel.deleteMany({});

    const docs = await OldModel.find({}).lean();
    console.log(`Found ${docs.length} documents in ${coll}`);

    let migratedDocs = [];

    for (let doc of docs) {
      // Cloudinary Image Migration for Products
      if (coll === "products" && Array.isArray(doc.image)) {
        console.log(`  Migrating images for product: ${doc.name}`);
        const newImageUrls = [];
        for (const imgUrl of doc.image) {
          try {
            console.log(`    Uploading ${imgUrl}...`);
            const uploadResult = await cloudinary.uploader.upload(imgUrl, { folder: "afiya-leathers" });
            newImageUrls.push(uploadResult.secure_url);
            console.log(`    Success: ${uploadResult.secure_url}`);
          } catch (err) {
            console.error(`    Failed to upload image: ${imgUrl}`, err.message);
            newImageUrls.push(imgUrl); // Fallback to old URL if it fails
          }
        }
        doc.image = newImageUrls;
      }
      
      migratedDocs.push(doc);
    }

    if (migratedDocs.length > 0) {
      await NewModel.insertMany(migratedDocs);
      console.log(`✅ Successfully inserted ${migratedDocs.length} documents into new ${coll} collection.`);
    } else {
      console.log(`No documents to insert for ${coll}.`);
    }
  }

  console.log("\nMigration Completed Successfully! Closing connections.");
  await oldDb.close();
  await newDb.close();
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
