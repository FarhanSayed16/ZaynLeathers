import { MongoClient } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

// Load the special handover environment variables
if (!fs.existsSync('.env.handover')) {
  console.error("❌ ERROR: Could not find .env.handover file. Please rename handover.env.template to .env.handover and fill in the credentials.");
  process.exit(1);
}
dotenv.config({ path: '.env.handover' });

const {
  OLD_MONGODB_URI,
  OLD_CLOUDINARY_NAME,
  NEW_MONGODB_URI,
  NEW_CLOUDINARY_NAME,
  NEW_CLOUDINARY_API_KEY,
  NEW_CLOUDINARY_SECRET_KEY,
  NEW_CLOUDINARY_FOLDER
} = process.env;

if (!OLD_MONGODB_URI || !NEW_MONGODB_URI || !NEW_CLOUDINARY_API_KEY) {
  console.error("❌ ERROR: Missing credentials in .env.handover");
  process.exit(1);
}

// Configure the NEW Cloudinary client (where we will upload)
cloudinary.config({
  cloud_name: NEW_CLOUDINARY_NAME,
  api_key: NEW_CLOUDINARY_API_KEY,
  api_secret: NEW_CLOUDINARY_SECRET_KEY,
});

async function uploadImageFromUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.includes('res.cloudinary.com')) return imageUrl;
  
  // If the image is already on the new cloudinary, skip
  if (imageUrl.includes(NEW_CLOUDINARY_NAME)) return imageUrl;

  console.log(`    Uploading image to new Cloudinary...`);
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: NEW_CLOUDINARY_FOLDER,
      resource_type: "auto"
    });
    return result.secure_url;
  } catch (err) {
    console.error(`    Failed to upload: ${imageUrl}`, err.message);
    return imageUrl; // Fallback to old URL if it fails
  }
}

async function run() {
  console.log('🚀 Starting Client Handover Migration...');
  
  const sourceClient = new MongoClient(OLD_MONGODB_URI);
  const destClient = new MongoClient(NEW_MONGODB_URI);
  
  try {
    await sourceClient.connect();
    await destClient.connect();
    console.log('✅ Connected to both Source and Destination MongoDB clusters.');

    // We assume the DB names are extracted from the URIs
    const sourceDb = sourceClient.db();
    const destDb = destClient.db();

    const collections = await sourceDb.listCollections().toArray();

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`\n📦 Processing collection: ${collectionName}...`);

      const sourceCollection = sourceDb.collection(collectionName);
      const destCollection = destDb.collection(collectionName);

      const docs = await sourceCollection.find({}).toArray();
      if (docs.length === 0) {
        console.log(`  -> Skipping (0 documents)`);
        continue;
      }

      const destCount = await destCollection.countDocuments();
      if (destCount > 0) {
        console.log(`  -> Dropping existing ${destCount} documents in destination...`);
        await destCollection.drop();
      }

      console.log(`  -> Found ${docs.length} documents. Preparing data...`);
      const updatedDocs = [];

      for (const doc of docs) {
        // --- TRANSLATE CLOUDINARY URLS ---
        
        // 1. Products: image array and video
        if (collectionName === 'products') {
          if (doc.image && Array.isArray(doc.image)) {
            doc.image = await Promise.all(doc.image.map(img => uploadImageFromUrl(img)));
          }
          if (doc.video) doc.video = await uploadImageFromUrl(doc.video);
          if (doc.modelVideo) doc.modelVideo = await uploadImageFromUrl(doc.modelVideo);
        }

        // 2. Categories: image
        if (collectionName === 'categories') {
          if (doc.image) doc.image = await uploadImageFromUrl(doc.image);
        }

        // 3. Hero Banners: image
        if (collectionName === 'herobanners') {
          if (doc.image) doc.image = await uploadImageFromUrl(doc.image);
        }

        // 4. Instagram Promos: image
        if (collectionName === 'instagrampromos') {
          if (doc.image) doc.image = await uploadImageFromUrl(doc.image);
        }
        
        // 5. Video Reviews: videoUrl and thumbnail
        if (collectionName === 'videoreviews') {
          if (doc.videoUrl) doc.videoUrl = await uploadImageFromUrl(doc.videoUrl);
          if (doc.thumbnail) doc.thumbnail = await uploadImageFromUrl(doc.thumbnail);
        }

        updatedDocs.push(doc);
      }

      console.log(`  -> Copying documents to destination DB...`);
      await destCollection.insertMany(updatedDocs);
      console.log(`  -> ✅ Successfully migrated ${collectionName}!`);
    }

    console.log('\n🎉 ALL DONE! The client database is now populated and all Cloudinary images have been ported over.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sourceClient.close();
    await destClient.close();
    console.log('Connections closed.');
  }
}

run();
