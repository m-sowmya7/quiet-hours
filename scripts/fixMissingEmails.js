// This script adds user_email to blocks missing it
// Usage: node fixMissingEmails.js

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI not set');

async function main() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  
  const db = client.db();
  const blocks = db.collection('blocks');
  
  // Find all blocks without user_email
  const missingEmailBlocks = await blocks.find({ 
    user_email: { $exists: false }
  }).toArray();
  
  console.log(`Found ${missingEmailBlocks.length} blocks missing user_email`);
  
  if (missingEmailBlocks.length === 0) {
    console.log('No blocks to fix');
    await client.close();
    return;
  }
  
  // Use Supabase to get user email if available, or reconstruct it
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  let updated = 0;
  
  for (const block of missingEmailBlocks) {
    try {
      // Try to get user email from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('id', block.user_id)
        .single();
      
      let userEmail;
      if (data && data.email) {
        userEmail = data.email;
      } else {
        // If we can't get from Supabase, ask for it
        if (process.argv[2] === '--auto') {
          // In auto mode, use user_id + placeholder domain
          userEmail = `${block.user_id}@placeholder.com`;
          console.log(`Using placeholder email for user ${block.user_id}: ${userEmail}`);
        } else {
          const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
          });
          
          userEmail = await new Promise(resolve => {
            readline.question(`Enter email for user ${block.user_id} (or press Enter to skip): `, email => {
              readline.close();
              resolve(email || null);
            });
          });
          
          if (!userEmail) {
            console.log(`Skipping block ${block._id}`);
            continue;
          }
        }
      }
      
      // Update the block with the user email
      const result = await blocks.updateOne(
        { _id: block._id },
        { $set: { user_email: userEmail } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`Updated block ${block._id} with email ${userEmail}`);
        updated++;
      }
    } catch (err) {
      console.error(`Error processing block ${block._id}:`, err);
    }
  }
  
  console.log(`Updated ${updated} of ${missingEmailBlocks.length} blocks`);
  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});