import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabaseClient';
import { getMongoClient } from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  // Expect bearer token from client: Authorization: Bearer <access_token>
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing auth' });
  const token = authHeader.split(' ')[1];

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData.user) return res.status(401).json({ error: 'Invalid token' });

  const user = userData.user;
  const { title, start_time, end_time } = req.body;
  if (!start_time) return res.status(400).json({ error: 'start_time required' });

  const client = await getMongoClient();
  const db = client.db();
  const blocks = db.collection('blocks');

  const doc = {
    user_id: user.id,
    title: title ?? 'Silent block',
    start_time: new Date(start_time), // ensure proper ISO
    end_time: end_time ? new Date(end_time) : null,
    notified: false,
    created_at: new Date()
  };

  const insertResult = await blocks.insertOne(doc);
  try {
    await supabaseAdmin
      .from('schedule_triggers')
      .insert({
        mongo_id: insertResult.insertedId.toString(),
        user_id: user.id,
        scheduled_time: doc.start_time.toISOString()
      });
  } catch (e) {
    console.warn('Supabase trigger insert failed (non-fatal)', e);
  }

  res.status(201).json({ ok: true, id: insertResult.insertedId });
}
