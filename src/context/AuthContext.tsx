import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import * as authService from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabase';

/**
 * VERTEX 3.44 — React Authentication Context
 *
 * Exposes user state, session lifecycle, and authentication operations to the application.
 * Completely decoupled from the DSA curriculum and progress stores.
 */

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  resendConfirmation: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured] = useState<boolean>(() => isSupabaseConfigured());

  // Restore session on mount and subscribe to auth lifecycle events
  useEffect(() => {
    let isMounted = true;

    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // 1. Restore stored session
    authService.getSession().then((initialSession) => {
      if (!isMounted) return;
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
      }
      setIsLoading(false);
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    // 2. Subscribe to auth state transitions
    const listener = authService.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setError(null);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      listener.unsubscribe();
    };
  }, [isConfigured]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string, fullName: string) => {
    setError(null);
    const res = await authService.signUp(email, password, fullName);

    if (!res.success) {
      const err = res.error || 'Failed to create account.';
      setError(err);
      return { success: false, error: err };
    }

    if (res.data?.session && res.data.user) {
      setSession(res.data.session);
      setUser(res.data.user);
      return { success: true, message: 'Account created and signed in.' };
    }
    return {
      success: true,
      message: 'Account created. Check your email for the confirmation link, then sign in.',
    };
  }, []);

  const handleResendConfirmation = useCallback(async (email: string) => {
    const res = await authService.resendSignupConfirmation(email);
    if (!res.success) {
      const err = res.error || 'Unable to resend the confirmation email.';
      setError(err);
      return { success: false, error: err };
    }
    setError(null);
    return { success: true };
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const res = await authService.signIn(email, password);

    if (!res.success) {
      const err = res.error || 'Failed to sign in.';
      setError(err);
      return { success: false, error: err, code: res.code };
    }

    if (res.data?.session) {
      setSession(res.data.session);
      setUser(res.data.user);
    }
    return { success: true };
  }, []);

  const handleSignOut = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    const result = await authService.signOut();
    setIsLoading(false);

    if (!result.success) {
      const message = result.error || 'Unable to sign out. Your current account remains active.';
      setError(message);
      throw new Error(message);
    }

    setSession(null);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    error,
    isConfigured,
    signUp: handleSignUp,
    signIn: handleSignIn,
    resendConfirmation: handleResendConfirmation,
    signOut: handleSignOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

