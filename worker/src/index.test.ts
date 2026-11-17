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

describe('Email OTP delivery and diagnostic error logging', () => {
  it('fails with 503 and logs missing MAIL_FROM when RESEND_API_KEY is configured without MAIL_FROM', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { env, calls } = makeEnv({ RESEND_API_KEY: 're_test_key_123' });

    const response = await worker.fetch(
      new Request('https://dsa.startora.tech/api/auth/email/start', {
        method: 'POST',
        headers: { Origin: 'https://dsa.startora.tech', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      }),
      env,
      context()
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'email_unavailable' });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('[email] Delivery failed: missing MAIL_FROM configuration')
    );
    // Verifies cleanup of code hash on failure
    expect(calls.some(c => c.sql.includes('DELETE FROM email_codes'))).toBe(true);
    // Asserts no API key was logged
    expect(consoleError.mock.calls.some(c => JSON.stringify(c).includes('re_test_key_123'))).toBe(false);
  });

  it('fails with 503 and logs missing provider key when neither Resend nor Brevo is configured', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { env } = makeEnv({ MAIL_FROM: 'no-reply@startora.tech' });

    const response = await worker.fetch(
      new Request('https://dsa.startora.tech/api/auth/email/start', {
        method: 'POST',
        headers: { Origin: 'https://dsa.startora.tech', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      }),
      env,
      context()
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'email_unavailable' });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('[email] Delivery failed: missing email provider configuration')
    );
  });

  it('logs sanitized Resend HTTP status and error response when Resend returns 403', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 403,
          message: 'The domain startora.tech is not verified. Visit https://resend.com/domains',
          name: 'validation_error',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const { env, calls } = makeEnv({
      RESEND_API_KEY: 're_secret_api_key_456',
      MAIL_FROM: 'no-reply@startora.tech',
    });

    const response = await worker.fetch(
      new Request('https://dsa.startora.tech/api/auth/email/start', {
        method: 'POST',
        headers: { Origin: 'https://dsa.startora.tech', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      }),
      env,
      context()
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'email_unavailable' });
    expect(fetchSpy).toHaveBeenCalledWith('https://api.resend.com/emails', expect.any(Object));
    expect(consoleError).toHaveBeenCalledWith(
      '[email] Resend HTTP error',
      expect.objectContaining({
        status: 403,
        error: expect.stringContaining('validation_error (403): The domain startora.tech is not verified'),
      })
    );
    // Verifies cleanup of code hash
    expect(calls.some(c => c.sql.includes('DELETE FROM email_codes'))).toBe(true);
    // Sensitive data assertion: API key and OTP code are never in the log
    const allLogText = consoleError.mock.calls.map(c => JSON.stringify(c)).join(' ');
    expect(allLogText).not.toContain('re_secret_api_key_456');
  });

  it('logs sanitized Resend HTTP status when Resend returns non-JSON error', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Bad Gateway from Cloudflare upstream', { status: 502 })
    );

    const { env } = makeEnv({
      RESEND_API_KEY: 're_secret_api_key_789',
      MAIL_FROM: 'no-reply@startora.tech',
    });

    const response = await worker.fetch(
      new Request('https://dsa.startora.tech/api/auth/email/start', {
        method: 'POST',
        headers: { Origin: 'https://dsa.startora.tech', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      }),
      env,
      context()
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'email_unavailable' });
    expect(consoleError).toHaveBeenCalledWith(
      '[email] Resend HTTP error',
      expect.objectContaining({
        status: 502,
        error: 'Bad Gateway from Cloudflare upstream',
      })
    );
  });

  it('distinguishes and logs network exceptions during email dispatch', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network connection timeout (ETIMEDOUT)'));

    const { env, calls } = makeEnv({
      RESEND_API_KEY: 're_secret_api_key_abc',
      MAIL_FROM: 'no-reply@startora.tech',
    });

    const response = await worker.fetch(
      new Request('https://dsa.startora.tech/api/auth/email/start', {
        method: 'POST',
        headers: { Origin: 'https://dsa.startora.tech', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      }),
      env,
      context()
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'email_unavailable' });
    expect(consoleError).toHaveBeenCalledWith(
      '[email] Resend network exception:',
      'Network connection timeout (ETIMEDOUT)'
    );
    expect(calls.some(c => c.sql.includes('DELETE FROM email_codes'))).toBe(true);
  });

  it('delivers email via Resend when configured properly and returns 200', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'resend_msg_123' }), { status: 200 })
    );

    const { env, calls } = makeEnv({
      RESEND_API_KEY: 're_valid_key',
      MAIL_FROM: 'no-reply@startora.tech',
    });

    const response = await worker.fetch(
      new Request('https://dsa.startora.tech/api/auth/email/start', {
        method: 'POST',
        headers: { Origin: 'https://dsa.startora.tech', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      }),
      env,
      context()
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer re_valid_key',
          'Content-Type': 'application/json',
        },
      })
    );
    // Verifies the code was inserted and NOT deleted
    expect(calls.some(c => c.sql.includes('INSERT INTO email_codes'))).toBe(true);
    expect(calls.some(c => c.sql.includes('DELETE FROM email_codes'))).toBe(false);
  });
});
