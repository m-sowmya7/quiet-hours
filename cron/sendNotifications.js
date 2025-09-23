const { MongoClient, ObjectId } = require('mongodb');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const FROM = process.env.FROM_EMAIL;

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI not set');

async function main() {
  console.log('Starting notification service at:', new Date().toISOString());
  // console.log('Environment check - MONGODB_URI:', MONGODB_URI ? 'Set' : 'Not set');
  // console.log('Environment check - SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Set' : 'Not set');
  // console.log('Environment check - FROM_EMAIL:', FROM);

  const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db();
  console.log('Successfully connected to MongoDB');

  if (process.env.INSERT_TEST_BLOCK === 'true') {
    console.log("Inserting test block because INSERT_TEST_BLOCK=true");
    await insertTestBlock(db);
  }

  const blocks = db.collection('blocks');

  const now = new Date();
  const target = new Date(now.getTime() + 10 * 60 * 1000); // exactly 10 minutes ahead
  const windowStart = new Date(target.getTime() - 30 * 1000); 
  const windowEnd = new Date(target.getTime() + 30 * 1000); 

  const candidates = await blocks
    .find({ notified: false, start_time: { $gte: windowStart, $lte: windowEnd } })
    .toArray();

  // console.log('Candidates:', candidates.map(c => ({ _id: c._id, notified: c.notified, start_time: c.start_time })));

  if (!candidates.length) {
    console.log('No candidates at', new Date().toISOString());
    await client.close();
    return;
  }

  const byUser = new Map();
  for (const c of candidates) {
    const key = c.user_id;
    if (!byUser.has(key)) byUser.set(key, c);
    else {
      const prev = byUser.get(key);
      if (new Date(c.start_time) < new Date(prev.start_time)) byUser.set(key, c);
    }
  }

  for (const block of Array.from(byUser.values())) {
    console.log('Trying to claim block:', block._id.toString(), block.notified);
    console.log('Type of block._id:', typeof block._id, block._id.constructor.name);
    console.log('Block before claim:', block);
    
    // Handle ObjectId correctly - if it's a string, convert it; if it's already an ObjectId, use as is
    const blockId = typeof block._id === 'string' ? new ObjectId(block._id) : block._id;
    
    const claim = await blocks.findOneAndUpdate(
      { _id: blockId, notified: false },
      { $set: { notified: true, notified_at: new Date() } },
      { returnDocument: 'after' }
    );

    console.log('Claim result:', claim);

    // MongoDB 6.x+ returns the document directly, not inside a 'value' property
    if (!claim) {
      console.log('Failed to claim block', block._id);
      continue;
    }
    
    const claimedDoc = claim;
    try {
      const msg = {
        to: block.user_email || block.user_id, 
        from: FROM,
        subject: `Reminder: Silent-study starts in 10 minutes`,
        text: `Hi — your silent-study "${block.title || 'block'}" starts at ${new Date(block.start_time).toLocaleString()}.`,
        html: `<p>Hi — your silent-study "<strong>${block.title || 'block'}</strong>" starts at <strong>${new Date(block.start_time).toLocaleString()}</strong>.</p>`
      };

      try {
        console.log("Attempting to send email to:", msg.to);
        await sgMail.send(msg);
        console.log("Email sent:", msg);
      } catch (err) {
        console.error("SendGrid error:", err.response ? err.response.body : err);
      }

      await blocks.updateOne(
        { _id: claimedDoc._id },
        { $set: { email_sent: true, email_sent_at: new Date() } }
      );
      console.log('Email marked as sent for', claimedDoc._id);
    } catch (err) {
      console.error('Send error, rolling back notified flag', err);
      await blocks.updateOne({ _id: claimedDoc._id }, { $set: { notified: false } });
    }

    await new Promise(r => setTimeout(r, 100));
  }

  await client.close();
}

async function insertTestBlock(db) {
  const blocks = db.collection('blocks');
  const now = new Date();
  const startTime = new Date(now.getTime() + 10 * 60 * 1000);
  await blocks.insertOne({
    user_id: "75f6922c-98f4-47f3-ba0a-60a82dc936f5",
    user_email: "mustiudaya@gmail.com",
    title: "Test Block",
    start_time: startTime,
    end_time: new Date(startTime.getTime() + 60 * 60 * 1000),
    notified: false,
    created_at: now
  });
  console.log("Inserted test block for user.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
