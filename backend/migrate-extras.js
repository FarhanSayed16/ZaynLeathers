import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

// Hardcode OLD DB URI because .env now has the new one
const OLD_MONGO_URI = "mongodb://mongoid1sih_db_user:mongodbsihfarhansayed1@ac-mm5czq5-shard-00-00.f15lco0.mongodb.net:27017,ac-mm5czq5-shard-00-01.f15lco0.mongodb.net:27017,ac-mm5czq5-shard-00-02.f15lco0.mongodb.net:27017/afiyaleathers?ssl=true&replicaSet=atlas-4364of-shard-0&authSource=admin&appName=Cluster0";

// Hardcode NEW explicit DB URI (Windows safe)
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

  const GenericSchema = new mongoose.Schema({}, { strict: false, timestamps: false, versionKey: false });

  // The extra collections
  const collections = ["categories", "herobanners", "instagrampromos", "sitesettings", "videoreviews", "contacts"];

  for (const coll of collections) {
    console.log(`\n--- Migrating Collection: ${coll} ---`);
    const OldModel = oldDb.model(coll, GenericSchema, coll);
    const NewModel = newDb.model(coll, GenericSchema, coll);

    await NewModel.deleteMany({});

    const docs = await OldModel.find({}).lean();
    console.log(`Found ${docs.length} documents in ${coll}`);

    let migratedDocs = [];

    for (let doc of docs) {
      
      // Cloudinary Image Migration for properties containing images
      if (doc.image && typeof doc.image === "string" && doc.image.includes("res.cloudinary.com")) {
        console.log(`  Uploading image for ${coll}...`);
        try {
          const uploadResult = await cloudinary.uploader.upload(doc.image, { folder: "afiya-leathers" });
          doc.image = uploadResult.secure_url;
        } catch (err) {
          console.error(`  Failed to upload image: ${doc.image}`, err.message);
        }
      }

      // Check if `sitesettings` has logo
      if (coll === "sitesettings" && doc.logo && typeof doc.logo === "string" && doc.logo.includes("res.cloudinary.com")) {
          console.log(`  Uploading logo for sitesettings...`);
          try {
            const uploadResult = await cloudinary.uploader.upload(doc.logo, { folder: "afiya-leathers" });
            doc.logo = uploadResult.secure_url;
          } catch (err) {
            console.error(`  Failed to upload logo: ${doc.logo}`, err.message);
          }
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

  console.log("\nExtra Migration Completed Successfully! Closing connections.");
  await oldDb.close();
  await newDb.close();
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
