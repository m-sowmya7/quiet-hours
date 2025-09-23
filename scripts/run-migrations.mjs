import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  console.log('Starting migration...');
  try {
    const migrationFilePath = path.join(process.cwd(), 'migrations', 'init.sql');
    console.log('Reading migration file:', migrationFilePath);
    const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');
    console.log('Migration SQL loaded, executing...');
    const { error } = await supabaseAdmin.rpc('pgexec', { query: migrationSQL });
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

runMigration();
