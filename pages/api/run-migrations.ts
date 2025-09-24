import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabaseClient';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for an API key for security
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.MIGRATION_API_KEY || 'test-key';
  
  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ 
        error: 'Supabase admin client not initialized. Make sure SUPABASE_SERVICE_ROLE_KEY is set.' 
      });
    }

    // Read the migration SQL file
    const migrationFilePath = path.join(process.cwd(), 'migrations', 'init.sql');
    const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');

    console.log('Running migrations...');
    
    // Execute the SQL directly with the Supabase admin client
    const { error: sqlError } = await supabaseAdmin.rpc('pg_execute', { 
      commands: migrationSQL 
    });
    
    if (sqlError) {
      console.error('Migration error:', sqlError);
      
      // Try alternative method - break into separate statements
      console.log('Trying alternative migration method...');
      
      // Split SQL into individual statements (simple approach)
      const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        try {
          const { error } = await supabaseAdmin.rpc('pg_execute', { 
            commands: statement + ';' 
          });
          
          if (error) {
            console.error('Statement error:', error, 'SQL:', statement);
          }
        } catch (stmtError) {
          console.error('Statement execution error:', stmtError);
        }
      }
      
      // Return a more generic success - some statements may have failed
      return res.status(200).json({ 
        success: true, 
        message: 'Migration completed with possible errors. Please check your database tables.' 
      });
    }

    return res.status(200).json({ success: true, message: 'Migrations applied successfully' });
  } catch (error: unknown) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}