import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

/**
 * VERTEX 3.44 — Authentication Service
 *
 * Provides typed, modular authentication operations using Supabase Auth (GoTrue).
 * Adheres strictly to security boundaries:
 * - Passwords are never persisted in state or storage.
 * - Client-side roles are never treated as authorization proof.
 * - Handles offline / unconfigured states gracefully.
 */

export interface AuthResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface AuthStateListener {
  unsubscribe: () => void;
}

/**
 * Normalizes GoTrue errors into clear, user-friendly messages.
 */
function normalizeAuthError(err: any): string {
  if (!err) return 'An unexpected authentication error occurred.';
  const msg = err.message || String(err);

  if (/invalid login credentials/i.test(msg) || /invalid_grant/i.test(msg)) {
    return 'Invalid email or password. Please verify your credentials.';
  }
  if (/user already registered/i.test(msg) || /already exists/i.test(msg)) {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (/password should be at least/i.test(msg) || /weak_password/i.test(msg)) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (/valid email/i.test(msg) || /invalid email/i.test(msg)) {
    return 'Please enter a valid email address.';
  }
  if (/network/i.test(msg) || /failed to fetch/i.test(msg) || /connection/i.test(msg)) {
    return 'Unable to reach the authentication server. Please check your network connection.';
  }

  return msg;
}

/**
 * Registers a new synthetic user account via Supabase Auth.
 */
export async function signUp(email: string, password: string): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Authentication service is not configured (offline mode).' };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Failed to obtain Supabase client.' };
  }

  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return { success: false, error: 'Email address is required.' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email: trimmedEmail,
      password,
    });

    if (error) {
      return {
        success: false,
        error: normalizeAuthError(error),
        code: error.code || 'SIGNUP_ERROR',
      };
    }

    return {
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: normalizeAuthError(err),
    };
  }
}

/**
 * Authenticates an existing user with email and password.
 */
export async function signIn(email: string, password: string): Promise<AuthResult<{ user: User; session: Session }>> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Authentication service is not configured (offline mode).' };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Failed to obtain Supabase client.' };
  }

  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return { success: false, error: 'Email address is required.' };
  }
  if (!password) {
    return { success: false, error: 'Password is required.' };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      return {
        success: false,
        error: normalizeAuthError(error),
        code: error.code || 'SIGNIN_ERROR',
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        error: 'Authentication completed but no active session was returned.',
      };
    }

    return {
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: normalizeAuthError(err),
    };
  }
}

/**
 * Terminates the active user session and clears authentication tokens.
 */
export async function signOut(): Promise<AuthResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: true }; // Nothing to sign out from
  }

  try {
    const { error } = await client.auth.signOut();
    if (error) {
      return {
        success: false,
        error: normalizeAuthError(error),
      };
    }
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: normalizeAuthError(err),
    };
  }
}

/**
 * Retrieves the currently active session from storage if valid.
 */
export async function getSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) return null;
    return data.session;
  } catch {
    return null;
  }
}

/**
 * Retrieves the authenticated user object from the backend token.
 */
export async function getUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Subscribes to authentication state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED).
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): AuthStateListener {
  const client = getSupabaseClient();
  if (!client) {
    return { unsubscribe: () => {} };
  }

  const { data } = client.auth.onAuthStateChange(callback);
  return {
    unsubscribe: () => {
      data.subscription.unsubscribe();
    },
  };
}

