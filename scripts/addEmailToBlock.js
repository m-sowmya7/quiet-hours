// This script updates a specific block to add or update the user_email field
// Usage: node addEmailToBlock.js <blockId> <email>

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI not set');

async function main() {
  const blockId = process.argv[2];
  const email = process.argv[3];
  
  if (!blockId || !email) {
    console.error('Usage: node addEmailToBlock.js <blockId> <email>');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const blocks = db.collection('blocks');

  const result = await blocks.updateOne(
    { _id: new ObjectId(blockId) },
    { $set: { user_email: email } }
  );

  console.log(`Updated block ${blockId} with email ${email}. Result:`, 
    result.matchedCount > 0 
      ? `${result.modifiedCount} document modified` 
      : 'Block not found');
  
  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});