import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Create a response object that we can modify
  const response = NextResponse.next();

  // Create a Supabase client with the middleware helper
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: any) => {
          response.cookies.delete({ name, ...options });
        }
      }
    }
  );
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Log debugging information
  console.log('Middleware - Checking route:', request.nextUrl.pathname);
  console.log('Middleware - Session found:', !!session);
  
  // Get all cookies for debugging
  const allCookies = request.cookies.getAll();
  console.log('Middleware - All cookies:', allCookies.map(c => c.name));
  
  // For our middleware logic, we'll use the actual session rather than looking at cookies directly
  const isAuthenticated = !!session;

  // Auth routes logic
  if (request.nextUrl.pathname.startsWith('/auth')) {
    if (isAuthenticated) {
      // If user is signed in and trying to access auth page, redirect to dashboard
      console.log('Middleware - Authenticated user trying to access auth page, redirecting to dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Allow access to auth pages if not signed in
    console.log('Middleware - Unauthenticated user accessing auth page, allowing');
    return response;
  }

  // Protected routes logic
  if (
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/profile') ||
    request.nextUrl.pathname.startsWith('/create-block')
  ) {
    if (!isAuthenticated) {
      // If not authenticated and trying to access protected page, redirect to login
      console.log('Middleware - Unauthenticated user trying to access protected page, redirecting to login');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    // Allow access to protected pages if authenticated
    console.log('Middleware - Authenticated user accessing protected page, allowing');
    return response;
  }

  // For other routes, just pass through
  console.log('Middleware - Allowing access to public route');
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/create-block/:path*', '/auth/:path*'],
};