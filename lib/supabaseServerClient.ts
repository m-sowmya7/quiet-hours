import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextApiRequest } from 'next';

export const getServerSupabase = (req: NextApiRequest) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          // This method must exist but we can't set cookies in API routes
          // No-op for API routes
        },
        remove(name: string, options: CookieOptions) {
          // This method must exist but we can't remove cookies in API routes
          // No-op for API routes
        },
      },
    }
  );
}