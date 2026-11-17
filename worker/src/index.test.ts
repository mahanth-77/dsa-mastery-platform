import { afterEach, describe, expect, it, vi } from 'vitest';
import worker, { type Env } from './index';

function makeEnv(overrides: Partial<Env> = {}) {
  const calls: Array<{ sql: string; values: unknown[]; method: string }> = [];
  const DB = {
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            async run() {
              calls.push({ sql, values, method: 'run' });
              return { meta: { changes: 1 } };
            },
            async first<T>() {
              calls.push({ sql, values, method: 'first' });
              return null as T | null;
            },
          };
        },
      };
    },
    batch: async () => [],
  };
  const env = {
    DB: DB as unknown as D1Database,
    APP_ORIGIN: 'https://dsa.startora.tech',
    GOOGLE_CLIENT_ID: 'vertex-test-client.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'test-secret',
    CODE_PEPPER: 'test-pepper',
    ...overrides,
  } as Env;
  return { env, calls };
}

function context() {
  return { waitUntil: vi.fn() } as unknown as ExecutionContext;
}

afterEach(() => vi.restoreAllMocks());

describe('Worker request security boundaries', () => {
  it('starts Google OAuth with a browser-bound state cookie, nonce and PKCE', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { env, calls } = makeEnv();
    const response = await worker.fetch(new Request('https://dsa.startora.tech/api/auth/google/start'), env, context());

    expect(response.status).toBe(302);
    const destination = new URL(response.headers.get('Location')!);
    expect(destination.origin).toBe('https://accounts.google.com');
    expect(destination.searchParams.get('state')).toBeTruthy();
    expect(destination.searchParams.get('nonce')).toBeTruthy();
    expect(destination.searchParams.get('code_challenge')).toBeTruthy();
    expect(destination.searchParams.get('code_challenge_method')).toBe('S256');
    expect(response.headers.get('Set-Cookie')).toContain('__Host-vertex_oauth_state=');
    expect(response.headers.get('Set-Cookie')).toContain('HttpOnly; SameSite=Lax; Max-Age=600; Secure');
    expect(calls.some(call => call.sql.includes('INSERT INTO oauth_states') && call.values[2] === destination.searchParams.get('nonce'))).toBe(true);
  });

  it('rejects an OAuth callback whose state cookie does not match the returned state', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { env, calls } = makeEnv();
    const response = await worker.fetch(
      new Request('https://dsa.startora.tech/api/auth/google/callback?code=attacker-code&state=attacker-state', {
        headers: { Cookie: '__Host-vertex_oauth_state=original-browser-state' },
      }),
      env,
      context()
    );

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('https://dsa.startora.tech/?signin=failed');
    expect(response.headers.get('Set-Cookie')).toContain('__Host-vertex_oauth_state=;');
    expect(calls).toHaveLength(0);
  });

  it('rejects state-changing requests from a foreign origin before touching D1', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { env, calls } = makeEnv();
    const response = await worker.fetch(
      new Request('https://dsa.startora.tech/api/auth/email/start', {
        method: 'POST',
        headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'person@example.com' }),
      }),
      env,
      context()
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'forbidden_origin' });
    expect(calls).toHaveLength(0);
  });

  it('does not expose a user without a valid session cookie', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { env, calls } = makeEnv();
    const response = await worker.fetch(new Request('https://dsa.startora.tech/api/auth/me'), env, context());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'unauthenticated' });
    expect(calls).toHaveLength(0);
  });
});
