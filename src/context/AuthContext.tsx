import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { accountApi, ApiError, type AccountUser } from '../lib/accountApi';

/**
 * Account state for the VERTEX account API (sign in with Google or an emailed code).
 *
 * The app is fully usable signed out: progress lives in the browser. If the API is
 * not deployed (or unreachable at start-up) `available` is false and the account UI
 * stays hidden rather than showing a broken sign-in.
 */

export type EmailStartResult = { ok: true } | { ok: false; error: string };
export type EmailVerifyResult = { ok: true } | { ok: false; error: string };

interface AuthContextType {
  user: AccountUser | null;
  /** True once we know whether a session exists. */
  ready: boolean;
  /** False when the account API cannot be reached at all. */
  available: boolean;
  /** Set when a Google redirect returned with a problem. */
  notice: string | null;
  dismissNotice: () => void;
  refresh: () => Promise<void>;
  startEmail: (email: string) => Promise<EmailStartResult>;
  verifyEmail: (email: string, code: string) => Promise<EmailVerifyResult>;
  /** Ends the session on the server. Prefer `useSync().signOut`, which saves progress first. */
  endSession: () => Promise<void>;
  clearUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const NOTICES: Record<string, string> = {
  failed: 'Google sign-in did not complete. Please try again.',
  cancelled: 'Google sign-in was cancelled.',
  unavailable: 'Google sign-in is not set up on this site yet.',
};

const ERROR_TEXT: Record<string, string> = {
  invalid_email: 'Enter a valid email address.',
  invalid_code: 'That code is wrong or has expired.',
  rate_limited: 'Too many attempts. Please wait a while and try again.',
  email_unavailable: 'Email sign-in is not available right now. Try Google instead.',
};

function describe(err: unknown): string {
  if (err instanceof ApiError) return ERROR_TEXT[err.code] || 'Something went wrong. Please try again.';
  return 'Could not reach the server. Check your connection and try again.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await accountApi.me();
      setUser(res.user);
      setAvailable(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'unauthenticated') {
        setUser(null);
        setAvailable(true); // the API answered; there is simply no session
      } else if (err instanceof ApiError || err instanceof TypeError) {
        // Not deployed (HTML or 404) or unreachable: keep working locally.
        setUser(null);
        setAvailable(false);
      } else {
        setUser(null);
      }
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    // Google redirects back to /?signin=ok|failed|cancelled|unavailable
    try {
      const url = new URL(window.location.href);
      const flag = url.searchParams.get('signin');
      if (flag) {
        if (NOTICES[flag]) setNotice(NOTICES[flag]);
        url.searchParams.delete('signin');
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
    } catch {
      /* ignore */
    }
    void refresh();
  }, [refresh]);

  const startEmail = useCallback(async (email: string): Promise<EmailStartResult> => {
    try {
      await accountApi.emailStart(email);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: describe(err) };
    }
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string): Promise<EmailVerifyResult> => {
    try {
      const res = await accountApi.emailVerify(email, code);
      setUser(res.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: describe(err) };
    }
  }, []);

  const endSession = useCallback(async () => {
    try {
      await accountApi.signOut();
    } catch {
      /* the cookie is cleared server-side when reachable; clear local state regardless */
    }
    setUser(null);
  }, []);

  const clearUser = useCallback(() => setUser(null), []);
  const dismissNotice = useCallback(() => setNotice(null), []);

  return (
    <AuthContext.Provider
      value={{ user, ready, available, notice, dismissNotice, refresh, startEmail, verifyEmail, endSession, clearUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
