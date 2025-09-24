import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabaseClient';
import { getMongoClient } from '../../lib/mongodb';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Expect bearer token from client: Authorization: Bearer <access_token>
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing auth' });
  const token = authHeader.split(' ')[1];

  // Create a server-side Supabase client for auth if supabaseAdmin is not available
  const authClient = supabaseAdmin || createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: userData, error: userErr } = await authClient.auth.getUser(token);
  if (userErr || !userData.user) return res.status(401).json({ error: 'Invalid token' });
  const user = userData.user;

  const client = await getMongoClient();
  const db = client.db();
  const blocks = db.collection('blocks');

  if (req.method === 'POST') {
    const { title, start_time, end_time } = req.body;
    if (!start_time) return res.status(400).json({ error: 'start_time required' });

    const doc = {
      user_id: user.id,
      user_email: user.email,
      title: title ?? 'Silent block',
      start_time: new Date(start_time), // ensure proper ISO
      end_time: end_time ? new Date(end_time) : null,
      notified: false,
      created_at: new Date()
    };

    const insertResult = await blocks.insertOne(doc);
    try {
      // Use the same authClient we created earlier
      await authClient
        .from('schedule_triggers')
        .insert({
          mongo_id: insertResult.insertedId.toString(),
          user_id: user.id,
          scheduled_time: doc.start_time.toISOString()
        });
    } catch (e) {
      console.warn('Supabase trigger insert failed (non-fatal)', e);
    }

    // Always trigger the notification script for the new block, passing its ObjectId
    try {
      // Import modules at the top level instead
      const { spawn } = await import('child_process');
      const path = await import('path');
      const child = spawn('node', [
        path.join(process.cwd(), 'cron', 'sendNotifications.js'),
        insertResult.insertedId.toString()
      ], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
    } catch (err) {
      console.warn('Failed to trigger notification cron job:', err);
    }
    return res.status(201).json({ ok: true, id: insertResult.insertedId });
  }

  if (req.method === 'GET') {
    // Get blocks for the authenticated user
    const userId = req.query.user_id || user.id;
    const userBlocks = await blocks
      .find({ user_id: userId })
      .sort({ start_time: 1 })
      .toArray();
    return res.status(200).json({ blocks: userBlocks });
  }

  return res.status(405).end();
}
