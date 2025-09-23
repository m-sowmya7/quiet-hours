const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not defined');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is not defined');
  process.exit(1);
}

async function runMigration() {
  console.log('Starting migration...');
  
  // Initialize Supabase admin client
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Read the migration SQL file
    const migrationFilePath = path.join(process.cwd(), 'migrations', 'init.sql');
    console.log('Reading migration file:', migrationFilePath);
    
    const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');
    console.log('Migration SQL loaded, executing...');

    // Execute the migration using pgSQL function
    const { error } = await supabaseAdmin.rpc('pgexec', { query: migrationSQL });
    
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigration();