import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const getSession = async () => {
      console.log('AuthContext - Getting initial session');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('AuthContext - Initial session:', !!session, 'User:', !!session?.user);
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`AuthContext - Auth state changed: ${event}`);
        console.log('AuthContext - New session:', !!session, 'User:', !!session?.user);
        
        // If we have a user, log their ID to help with debugging
        if (session?.user) {
          console.log('AuthContext - User ID:', session.user.id);
          console.log('AuthContext - User Email:', session.user.email);
        }
        
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => {
      console.log('AuthContext - Cleaning up auth listener');
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign out function
  const signOut = async () => {
    await supabase.auth.signOut();
  };
  
  // Refresh session function
  const refreshSession = async () => {
    console.log('AuthContext - Manually refreshing session');
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user || null);
    console.log('AuthContext - Session refreshed:', !!session, 'User:', !!session?.user);
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}