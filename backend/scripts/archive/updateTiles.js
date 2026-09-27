import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function run() {
  const uri = process.env.MONGODB_URI;
  const baseUri = uri.replace('/afiyaleathers', '/').replace('/afhiyaleathers', '/');
  const client = new MongoClient(baseUri);
  
  try {
    await client.connect();
    const db = client.db('afiyaleathers');
    const settingsColl = db.collection('sitesettings');
    
    const s = await settingsColl.findOne({});
    if (s && s.categoryTiles) {
      const updatedTiles = s.categoryTiles.map(t => ({
        ...t,
        image: t.image.replace('.jpg', '.png')
      }));
      await settingsColl.updateOne({_id: s._id}, { $set: { categoryTiles: updatedTiles } });
      console.log('Successfully updated category tiles to .png in DB!');
    }
  } finally {
    await client.close();
  }
}
run();
