import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * VERTEX — Supabase client foundation.
 *
 * Cloud features are disabled unless real project URL and publishable/anon key
 * values are supplied by the build environment. Local progress remains usable
 * when the backend is not configured.
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let clientInstance: SupabaseClient | null = null;
let configurationError: string | null = null;

function extractJwtRole(key: string): string | null {
  try {
    const parts = key.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const procEnv =
    typeof globalThis !== 'undefined' && (globalThis as any).process?.env
      ? (globalThis as any).process.env
      : {};
  const env =
    typeof import.meta !== 'undefined' && (import.meta as any).env
      ? (import.meta as any).env
      : procEnv;

  const url = String(env.VITE_SUPABASE_URL || '').trim();
  const anonKey = String(env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (!url || !anonKey) {
    configurationError =
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Cloud features are disabled; local progress remains available.';
    return null;
  }

  // A frontend bundle must never contain a Supabase service-role secret.
  if (extractJwtRole(anonKey) === 'service_role') {
    configurationError =
      'Unsafe Supabase configuration: a service-role key cannot be used in the browser.';
    console.error('[VERTEX Security] Refusing to initialize Supabase with a service-role key.');
    return null;
  }

  try {
    const parsed = new URL(url);
    const isLocalHttp =
      parsed.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !isLocalHttp) {
      configurationError = 'VITE_SUPABASE_URL must use HTTPS outside local development.';
      return null;
    }
  } catch {
    configurationError = 'VITE_SUPABASE_URL is not a valid absolute URL.';
    return null;
  }

  configurationError = null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

export function getConfigurationError(): string | null {
  return configurationError;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;

  const config = getSupabaseConfig();
  if (!config) {
    console.warn(`[VERTEX Auth] ${configurationError || 'Supabase is not configured'}`);
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
  } catch (err) {
    configurationError =
      err instanceof Error ? err.message : 'Supabase client initialization failed.';
    console.error('[VERTEX Auth] Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function checkSupabaseHealth(): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config) return false;

  try {
    const response = await fetch(`${config.url}/auth/v1/health`, {
      method: 'GET',
      headers: { apikey: config.anonKey },
    });
    return response.ok;
  } catch {
    return false;
  }
}
