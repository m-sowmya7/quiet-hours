const sgMail = require('@sendgrid/mail');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const FROM = process.env.FROM_EMAIL;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Starting notification service at:', new Date().toISOString());
  console.log('Environment check - SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
  console.log('Environment check - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
  console.log('Environment check - SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Set' : 'Not set');
  console.log('Environment check - FROM_EMAIL:', FROM);

  if (process.env.INSERT_TEST_BLOCK === 'true') {
    console.log("Inserting test block because INSERT_TEST_BLOCK=true");
    await insertTestBlock();
  }

  const now = new Date();
  const target = new Date(now.getTime() + 10 * 60 * 1000); // exactly 10 minutes ahead
  const windowStart = new Date(target.getTime() - 30 * 1000); 
  const windowEnd = new Date(target.getTime() + 30 * 1000); 

  // Find blocks that are due for notification
  const { data: candidates, error: fetchError } = await supabase
    .from('blocks')
    .select('*')
    .eq('notified', false)
    .gte('start_time', windowStart.toISOString())
    .lte('start_time', windowEnd.toISOString());

  if (fetchError) {
    console.error('Error fetching blocks:', fetchError);
    return;
  }

  console.log('Candidates:', candidates ? candidates.map(c => ({ id: c.id, notified: c.notified, start_time: c.start_time })) : []);

  if (!candidates || !candidates.length) {
    console.log('No candidates at', new Date().toISOString());
    return;
  }

  // Group by user and get the earliest block for each
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
    console.log('Trying to claim block:', block.id, block.notified);
    
    // Check if the user exists in auth.users
    const { data: userData, error: userError } = await supabase
      .auth
      .admin
      .getUserById(block.user_id);

    if (userError || !userData) {
      console.log('User not found or error:', userError);
      continue;
    }

    // Mark as notified (pessimistic approach)
    const { data: updatedBlock, error: updateError } = await supabase
      .from('blocks')
      .update({ 
        notified: true, 
        notified_at: new Date().toISOString() 
      })
      .eq('id', block.id)
      .eq('notified', false)
      .select()
      .single();
    
    if (updateError || !updatedBlock) {
      console.log('Failed to claim block', block.id, updateError);
      continue;
    }
    
    try {
      const msg = {
        to: block.user_email || userData.user.email,
        from: FROM,
        subject: `Reminder: Silent-study starts in 10 minutes`,
        text: `Hi — your silent-study "${block.title || 'block'}" starts at ${new Date(block.start_time).toLocaleString()}.`,
        html: `<p>Hi — your silent-study "<strong>${block.title || 'block'}</strong>" starts at <strong>${new Date(block.start_time).toLocaleString()}</strong>.</p>`
      };

      try {
        console.log("Attempting to send email to:", msg.to);
        await sgMail.send(msg);
        console.log("✅ Email sent:", msg);
        
        // Mark as email sent
        await supabase
          .from('blocks')
          .update({ 
            email_sent: true, 
            email_sent_at: new Date().toISOString() 
          })
          .eq('id', block.id);
          
        console.log('Email marked as sent for', block.id);
      } catch (err) {
        console.error("❌ SendGrid error:", err.response ? err.response.body : err);
        
        // Roll back notified status on email send failure
        await supabase
          .from('blocks')
          .update({ notified: false })
          .eq('id', block.id);
      }
    } catch (err) {
      console.error('Error handling notification:', err);
      
      // Roll back notified status on any error
      await supabase
        .from('blocks')
        .update({ notified: false })
        .eq('id', block.id);
    }

    // Prevent rate limiting
    await new Promise(r => setTimeout(r, 100));
  }
}

async function insertTestBlock() {
  // Check if user exists in auth
  const { data: user, error: userError } = await supabase
    .auth
    .admin
    .listUsers({ 
      perPage: 1,
      page: 1,
    });

  if (userError || !user || user.users.length === 0) {
    console.error('No users found in the system:', userError);
    return;
  }

  const testUser = user.users[0];
  const now = new Date();
  const startTime = new Date(now.getTime() + 10 * 60 * 1000);
  
  const { data, error } = await supabase
    .from('blocks')
    .insert({
      user_id: testUser.id,
      user_email: testUser.email,
      title: "Test Block",
      start_time: startTime.toISOString(),
      end_time: new Date(startTime.getTime() + 60 * 60 * 1000).toISOString(),
      notified: false,
      created_at: now.toISOString()
    });

  if (error) {
    console.error('Failed to insert test block:', error);
    return;
  }
  
  console.log("Inserted test block for user:", testUser.email);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});