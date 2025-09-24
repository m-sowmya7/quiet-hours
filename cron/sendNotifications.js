const { MongoClient, ObjectId } = require('mongodb');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const FROM = process.env.FROM_EMAIL;

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI not set');

async function main() {
  console.log('Starting notification service at:', new Date().toISOString());

  const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db();
  console.log('Successfully connected to MongoDB');
  const blocks = db.collection('blocks');

  // Accept optional blockId as argument
  const blockIdArg = process.argv[2];
  let candidates = [];
  if (blockIdArg) {
    // Only process the block with this ObjectId if it exists and is not notified
    const block = await blocks.findOne({ _id: new ObjectId(blockIdArg), notified: false });
    if (block) candidates = [block];
    console.log('Candidate block by ObjectId:', candidates.map(c => ({
      _id: c._id,
      user_id: c.user_id,
      user_email: c.user_email,
      notified: c.notified,
      start_time: c.start_time,
      created_at: c.created_at
    })));
  } else {
    const now = new Date();
    const target = new Date(now.getTime() + 10 * 60 * 1000); // exactly 10 minutes ahead
    const windowStart = new Date(target.getTime() - 30 * 1000); 
    const windowEnd = new Date(target.getTime() + 30 * 1000); 
    candidates = await blocks
      .find({ notified: false, start_time: { $gte: windowStart, $lte: windowEnd } })
      .toArray();
    // Log all candidate blocks for debugging
    console.log('Candidate blocks found:', candidates.map(c => ({
      _id: c._id,
      user_id: c.user_id,
      user_email: c.user_email,
      notified: c.notified,
      start_time: c.start_time,
      created_at: c.created_at
    })));
  }

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
    // Only send emails to users who have a valid user_email (authenticated users)
    if (!block.user_email) {
      console.log('Skipping block for unauthenticated user:', block.user_id);
      continue;
    }
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

    if (!claim) {
      console.log('Failed to claim block', block._id);
      continue;
    }

    const claimedDoc = claim;
    try {
      const msg = {
        to: block.user_email,
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



main().catch((err) => {
  console.error(err);
  process.exit(1);
});
