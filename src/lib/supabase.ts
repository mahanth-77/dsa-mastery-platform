import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * VERTEX 3.44 — Supabase Client Foundation
 *
 * Implements a singleton Supabase client targeting the local Supabase instance.
 * Preserves application uptime with graceful offline fallback when unconfigured.
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let clientInstance: SupabaseClient | null = null;
let configurationError: string | null = null;

/**
 * Decodes the role from a JWT token without external dependencies to verify it is NOT a service_role key.
 */
function extractJwtRole(jwt: string): string | null {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

/**
 * Validates and retrieves the Supabase client configuration.
 */
export function getSupabaseConfig(): SupabaseConfig | null {
  const procEnv = (typeof globalThis !== 'undefined' && (globalThis as any).process?.env) ? (globalThis as any).process.env : {};
  const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : procEnv;
  const url = (env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321')?.trim();
  const anonKey = (env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')?.trim();

  if (!url || !anonKey) {
    configurationError = 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.';
    return null;
  }

  // Security guard: Ensure service-role key is never used in frontend code
  const role = extractJwtRole(anonKey);
  if (role === 'service_role') {
    const fatalMsg = '[VERTEX Security Fatal] SERVICE_ROLE key detected in frontend configuration! Refusing to initialize.';
    console.error(fatalMsg);
    throw new Error(fatalMsg);
  }

  // Validate URL shape
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      configurationError = `Invalid URL protocol: ${parsed.protocol}`;
      return null;
    }
  } catch (e) {
    configurationError = `Invalid VITE_SUPABASE_URL: ${url}`;
    return null;
  }

  return { url, anonKey };
}

/**
 * Returns whether Supabase has a valid, safe configuration available.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

/**
 * Returns the diagnostic configuration error, if any.
 */
export function getConfigurationError(): string | null {
  return configurationError;
}

/**
 * Returns the singleton Supabase client instance.
 * Returns null if the client is not configured or in fallback mode.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) {
    return clientInstance;
  }

  const config = getSupabaseConfig();
  if (!config) {
    console.warn(`[VERTEX Auth] Supabase not configured: ${configurationError || 'Unknown'}. Operating in local-only fallback mode.`);
    return null;
  }

  try {
    clientInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'vertex-supabase-auth-token',
      },
    });
    return clientInstance;
  } catch (err: any) {
    console.error('[VERTEX Auth] Failed to initialize Supabase client:', err);
    configurationError = err.message || 'Initialization failure';
    return null;
  }
}

/**
 * Verifies backend connectivity by pinging the GoTrue auth health endpoint.
 */
export async function checkSupabaseHealth(): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config) return false;

  try {
    const response = await fetch(`${config.url}/auth/v1/health`, {
      method: 'GET',
      headers: {
        apikey: config.anonKey,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

