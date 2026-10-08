import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, cookieStorage } from '../lib/supabase.ts';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null; data?: any }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null; data?: any }>;
  resendVerificationOtp: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to ensure a row in user_settings exists on initial sign-in
  const ensureUserSettings = async (userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase
        .from('user_settings')
        .upsert(
          { user_id: userId, theme: 'system', browser_notifications: false },
          { onConflict: 'user_id', ignoreDuplicates: true }
        );
    } catch (err) {
      console.warn('Could not upsert user_settings:', err);
    }
  };

  useEffect(() => {
    // Clean up any residual legacy demo cookies
    cookieStorage.removeItem('jobtracker_demo_mode');
    cookieStorage.removeItem('jobtracker_demo_email');

    if (!isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      setIsLoading(false);
      return;
    }

    // Check existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        setIsLoading(false);
        ensureUserSettings(session.user.id);
      } else {
        setSession(null);
        setUser(null);
        setIsLoading(false);
      }
    }).catch(() => {
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
      } else {
        setSession(null);
        setUser(null);
      }
      setIsLoading(false);

      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        await ensureUserSettings(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error(
          'Supabase is not configured yet. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
        ),
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { error };
    }
    setSession(data.session);
    setUser(data.user);
    if (data.user) {
      await ensureUserSettings(data.user.id);
    }
    return { error: null };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error(
          'Supabase is not configured yet. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
        ),
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      return { error };
    }
    if (data.session && data.user) {
      setSession(data.session);
      setUser(data.user);
      await ensureUserSettings(data.user.id);
    }
    return { error: null, data };
  };

  const verifyOtp = async (email: string, token: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error('Supabase is not configured yet. Make sure credentials are set.'),
      };
    }

    const trimmedToken = token.trim();
    // Attempt signup verification first, then fallback to email OTP verification
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: trimmedToken,
      type: 'signup',
    });

    if (error) {
      // Also try 'email' type if project configured magic link/email otp
      const secondAttempt = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: trimmedToken,
        type: 'email',
      });
      if (secondAttempt.error) {
        return { error: secondAttempt.error };
      }
      if (secondAttempt.data.session && secondAttempt.data.user) {
        setSession(secondAttempt.data.session);
        setUser(secondAttempt.data.user);
        await ensureUserSettings(secondAttempt.data.user.id);
      }
      return { error: null, data: secondAttempt.data };
    }

    if (data.session && data.user) {
      setSession(data.session);
      setUser(data.user);
      await ensureUserSettings(data.user.id);
    }
    return { error: null, data };
  };

  const resendVerificationOtp = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    });
    return { error };
  };

  const signOut = async () => {
    cookieStorage.removeItem('jobtracker_demo_mode');
    cookieStorage.removeItem('jobtracker_demo_email');
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signInWithEmail,
        signUpWithEmail,
        verifyOtp,
        resendVerificationOtp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
