import { MongoClient } from 'mongodb';
import 'dotenv/config';

const uri = process.env.MONGODB_URI; // This will currently contain afiyaleathers

// Reconstruct the base URI by stripping out the db name, so we can connect to both
const baseUri = uri.replace('/afiyaleathers', '/').replace('/afhiyaleathers', '/');

const sourceDbName = 'afhiyaleathers';
const destDbName = 'afiyaleathers';

async function run() {
  console.log('Connecting to MongoDB cluster...');
  const client = new MongoClient(baseUri);
  
  try {
    await client.connect();
    console.log('Successfully connected to MongoDB cluster.');

    const sourceDb = client.db(sourceDbName);
    const destDb = client.db(destDbName);

    // Get all collections in the source database
    const collections = await sourceDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections in source DB.`);

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`\nProcessing collection: ${collectionName}...`);

      const sourceCollection = sourceDb.collection(collectionName);
      const destCollection = destDb.collection(collectionName);

      // Get all documents
      const docs = await sourceCollection.find({}).toArray();
      
      if (docs.length === 0) {
        console.log(`  -> Skipping ${collectionName} (0 documents)`);
        continue;
      }

      // Check if destination already has documents (to prevent duplicate key errors if run twice)
      const destCount = await destCollection.countDocuments();
      if (destCount > 0) {
        console.log(`  -> Destination collection ${collectionName} already has ${destCount} documents. Dropping it first...`);
        await destCollection.drop();
      }

      // Insert all documents into the destination
      console.log(`  -> Copying ${docs.length} documents...`);
      await destCollection.insertMany(docs);
      console.log(`  -> Successfully copied ${collectionName}!`);
    }

    console.log('\n✅ Migration fully complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
    console.log('Connection closed.');
  }
}

run();
