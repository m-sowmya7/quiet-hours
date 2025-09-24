// Usage: node updateBlockStartTime.js <blockId>
// This script updates the start_time of a block to 10 minutes from now (UTC)

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI not set');

async function main() {
  const blockId = process.argv[2];
  if (!blockId) {
    console.error('Usage: node updateBlockStartTime.js <blockId>');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const blocks = db.collection('blocks');

  const newStart = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  const result = await blocks.updateOne(
    { _id: new ObjectId(blockId) },
    { $set: { start_time: newStart, notified: false } }
  );
  console.log('Updated block:', blockId, 'New start_time:', newStart.toISOString(), 'Result:', result.modifiedCount);
  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
