import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(_request: NextRequest) {
  return NextResponse.json({ 
    envCheck: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      // Don't expose actual values, just check if they exist
      SERVICE_KEY_EXISTS: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
}