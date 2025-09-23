import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, refreshSession } = useAuth();
  const router = useRouter();
  const [refreshAttempted, setRefreshAttempted] = useState(false);

  useEffect(() => {
    // Add console logging for debugging
    console.log('ProtectedRoute - Loading:', loading, 'User:', !!user);
    
    const checkAuth = async () => {
      // If we're not loading and don't have a user, attempt to refresh session once
      if (!loading && !user && !refreshAttempted) {
        console.log('ProtectedRoute - No user detected, attempting to refresh session');
        setRefreshAttempted(true);
        await refreshSession();
      } else if (!loading && !user && refreshAttempted) {
        console.log('ProtectedRoute - Still no user after refresh, redirecting to login');
        // Use window.location for a hard redirect to ensure we get a fresh session check
        window.location.href = '/auth/login';
      }
    };
    
    checkAuth();
  }, [loading, user, refreshSession, refreshAttempted, router]);

  if (loading || (!user && !refreshAttempted)) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  return <>{children}</>;
}