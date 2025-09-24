import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '../types/database.types';
import { useAuth } from '../contexts/AuthContext';
// Removed unused import
import { useEffect } from 'react';

export default async function AuthRedirect() {
  try {
    const cookieStore = await cookies();
    // Try to create a server client first
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      redirect('/dashboard');
    }
  } catch (error) {
    // Fall back to client-side check using the client object
    console.error("Error in server-side auth check:", error);
    // We cannot reliably check auth state here in case of error, 
    // so we'll let the client-side check handle it
  }

  // If no session or error occurred, render the children
  return null;
}