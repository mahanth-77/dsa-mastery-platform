/**
 * VERTEX account API (Cloudflare Worker + D1).
 *
 *   POST   /api/auth/email/start      { email }            -> emails a 6-digit code
 *   POST   /api/auth/email/verify     { email, code }      -> sets the session cookie
 *   GET    /api/auth/google/start                          -> redirects to Google (PKCE)
 *   GET    /api/auth/google/callback                       -> finishes Google sign-in
 *   GET    /api/auth/me                                    -> current user or 401
 *   POST   /api/auth/signout                               -> ends the session
 *   GET    /api/progress                                   -> { rev, epoch, data }
 *   PUT    /api/progress     { baseRev, epoch, data }      -> optimistic-concurrency write
 *   DELETE /api/account                                    -> deletes the account and its data
 *
 * Sessions are random tokens in an HttpOnly cookie; only their SHA-256 is stored.
 */

import {
  CODE_TTL_MS,
  MAX_CODE_ATTEMPTS,
  SESSION_TTL_MS,
    clearedCookie,
  codeDigest,
  cookieName,
  verifyGoogleIdToken,
  oauthStateCookie,
  oauthStateCookieName,
  clearedOauthStateCookie,
  generateCode,
  isAllowedOrigin,
  isValidEmail,
  normalizeEmail,
  parseCookies,
  pkceChallenge,
  randomToken,
  sessionCookie,
  sha256Hex,
  timingSafeEqual,
  validateProgressData,
} from './lib';

export interface Env {
  DB: D1Database;
  APP_ORIGIN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  CODE_PEPPER: string;
  MAIL_FROM_NAME?: string;
  MAIL_FROM?: string;
  BREVO_API_KEY?: string;
  RESEND_API_KEY?: string;
  DEV_LOG_CODES?: string;
}

interface SessionUser {
  id: string;
  email: string;
}

// ─── Small response helpers ──────────────────────────────────────────────────

function json(body: unknown, status = 200, extra?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extra,
    },
  });
}

function redirect(location: string, cookie?: string): Response {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store' });
  if (cookie) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 302, headers });
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  const type = request.headers.get('Content-Type') || '';
  if (!type.includes('application/json')) return null;
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// ─── Rate limiting (fixed window, stored in D1) ──────────────────────────────

async function allow(env: Env, key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const win = Math.floor(now / windowMs);
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (key, count, expires_at) VALUES (?, 1, ?)
     ON CONFLICT(key) DO UPDATE SET count = count + 1
     RETURNING count`
  )
    .bind(`${key}:${win}`, (win + 2) * windowMs)
    .first<{ count: number }>();
  return (row?.count ?? 1) <= limit;
}

async function cleanup(env: Env): Promise<void> {
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now),
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
    env.DB.prepare('DELETE FROM email_codes WHERE expires_at < ?').bind(now),
    env.DB.prepare('DELETE FROM oauth_states WHERE expires_at < ?').bind(now),
  ]);
}

// ─── Users and sessions ──────────────────────────────────────────────────────

interface UserRow {
  id: string;
  email: string;
  google_sub: string | null;
}

async function findOrCreateUser(env: Env, email: string, googleSub?: string): Promise<UserRow> {
  let user: UserRow | null = null;
  if (googleSub) {
    user = await env.DB.prepare('SELECT id, email, google_sub FROM users WHERE google_sub = ?')
      .bind(googleSub)
      .first<UserRow>();
  }
  if (!user) {
    user = await env.DB.prepare('SELECT id, email, google_sub FROM users WHERE email = ?')
      .bind(email)
      .first<UserRow>();
  }
  if (user) {
    if (googleSub && !user.google_sub) {
      await env.DB.prepare('UPDATE users SET google_sub = ? WHERE id = ?').bind(googleSub, user.id).run();
    }
    return user;
  }
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO users (id, email, google_sub, created_at) VALUES (?, ?, ?, ?)')
    .bind(id, email, googleSub ?? null, Date.now())
    .run();
  return { id, email, google_sub: googleSub ?? null };
}

async function createSession(env: Env, userId: string): Promise<string> {
  const token = randomToken(32);
  const now = Date.now();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256Hex(token), userId, now, now + SESSION_TTL_MS)
    .run();
  return sessionCookie(cookieName(env.APP_ORIGIN), token, Math.floor(SESSION_TTL_MS / 1000), isSecure(env));
}

async function currentUser(request: Request, env: Env): Promise<SessionUser | null> {
  const token = parseCookies(request.headers.get('Cookie'))[cookieName(env.APP_ORIGIN)];
  if (!token) return null;
  return env.DB.prepare(
    `SELECT u.id AS id, u.email AS email
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?`
  )
    .bind(await sha256Hex(token), Date.now())
    .first<SessionUser>();
}

function isSecure(env: Env): boolean {
  return env.APP_ORIGIN.startsWith('https://');
}

// ─── Email delivery ──────────────────────────────────────────────────────────

async function sendCodeEmail(env: Env, to: string, code: string): Promise<boolean> {
  const subject = `Your VERTEX sign-in code: ${code}`;
  const text =
    `Your VERTEX sign-in code is ${code}.\n\n` +
    `It expires in 10 minutes. If you did not ask for it, you can ignore this email.`;
  const fromName = env.MAIL_FROM_NAME || 'VERTEX';

  try {
    if (env.BREVO_API_KEY && env.MAIL_FROM) {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: fromName, email: env.MAIL_FROM },
          to: [{ email: to }],
          subject,
          textContent: text,
        }),
      });
      return res.ok;
    }
    if (env.RESEND_API_KEY && env.MAIL_FROM) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: `${fromName} <${env.MAIL_FROM}>`, to: [to], subject, text }),
      });
      return res.ok;
    }
  } catch {
    return false;
  }
  if (env.DEV_LOG_CODES === '1') {
    console.log(`[dev] sign-in code for ${to}: ${code}`);
    return true;
  }
  return false;
}

// ─── Route handlers ──────────────────────────────────────────────────────────

async function emailStart(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (!body || !isValidEmail(body.email)) return json({ error: 'invalid_email' }, 400);
  const email = normalizeEmail(body.email);

  if (!(await allow(env, `start:${email}`, 5, 3_600_000)) || !(await allow(env, 'start:all', 500, 3_600_000))) {
    return json({ error: 'rate_limited' }, 429);
  }

  const code = generateCode();
  await env.DB.prepare(
    `INSERT INTO email_codes (email, code_hash, expires_at, attempts) VALUES (?, ?, ?, 0)
     ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash,
                                      expires_at = excluded.expires_at,
                                      attempts = 0`
  )
    .bind(email, await codeDigest(email, code, env.CODE_PEPPER), Date.now() + CODE_TTL_MS)
    .run();

  if (!(await sendCodeEmail(env, email, code))) {
    await env.DB.prepare('DELETE FROM email_codes WHERE email = ?').bind(email).run();
    return json({ error: 'email_unavailable' }, 503);
  }
  // Same answer whether or not the address already has an account.
  return json({ ok: true });
}

async function emailVerify(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (!body || !isValidEmail(body.email) || typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) {
    return json({ error: 'invalid_code' }, 400);
  }
  const email = normalizeEmail(body.email);
  if (!(await allow(env, `verify:${email}`, 20, 3_600_000))) return json({ error: 'rate_limited' }, 429);

  // Count the guess first, atomically, so parallel guesses cannot beat the attempt limit.
  const row = await env.DB.prepare(
    `UPDATE email_codes SET attempts = attempts + 1
      WHERE email = ? AND expires_at > ?
      RETURNING code_hash, attempts`
  )
    .bind(email, Date.now())
    .first<{ code_hash: string; attempts: number }>();

  if (!row) return json({ error: 'invalid_code' }, 400);
  if (row.attempts > MAX_CODE_ATTEMPTS) {
    await env.DB.prepare('DELETE FROM email_codes WHERE email = ?').bind(email).run();
    return json({ error: 'invalid_code' }, 400);
  }
  if (!timingSafeEqual(row.code_hash, await codeDigest(email, body.code, env.CODE_PEPPER))) {
    return json({ error: 'invalid_code' }, 400);
  }

  await env.DB.prepare('DELETE FROM email_codes WHERE email = ?').bind(email).run();
  const user = await findOrCreateUser(env, email);
  const cookie = await createSession(env, user.id);
  return json({ user: { id: user.id, email: user.email } }, 200, { 'Set-Cookie': cookie });
}

async function googleStart(env: Env): Promise<Response> {
  if (!env.GOOGLE_CLIENT_ID) return redirect(`${env.APP_ORIGIN}/?signin=unavailable`);
  const state = randomToken(24);
  const nonce = randomToken(24);
  const verifier = randomToken(48);
  await env.DB.prepare('INSERT INTO oauth_states (state, verifier, nonce, expires_at) VALUES (?, ?, ?, ?)')
    .bind(state, verifier, nonce, Date.now() + CODE_TTL_MS)
    .run();

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', `${env.APP_ORIGIN}/api/auth/google/callback`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email');
  url.searchParams.set('state', state);
  url.searchParams.set('nonce', nonce);
  url.searchParams.set('code_challenge', await pkceChallenge(verifier));
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('prompt', 'select_account');
  return redirect(url.toString(), oauthStateCookie(state, isSecure(env)));
}

async function googleCallback(request: Request, env: Env): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const secure = isSecure(env);
  const clearStateCookie = clearedOauthStateCookie(secure);
  const back = (flag: string) => redirect(`${env.APP_ORIGIN}/?signin=${flag}`, clearStateCookie);

  if (params.get('error')) return back('cancelled');
  const code = params.get('code');
  const state = params.get('state');
  const browserState = parseCookies(request.headers.get('Cookie'))[oauthStateCookieName(secure)];
  if (!code || !state || !browserState || !timingSafeEqual(state, browserState)) return back('failed');

  // State is bound to the initiating browser and consumed exactly once.
  const saved = await env.DB.prepare('DELETE FROM oauth_states WHERE state = ? AND expires_at > ? RETURNING verifier, nonce')
    .bind(state, Date.now())
    .first<{ verifier: string; nonce: string }>();
  if (!saved) return back('failed');

  let idToken: string | undefined;
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${env.APP_ORIGIN}/api/auth/google/callback`,
        grant_type: 'authorization_code',
        code_verifier: saved.verifier,
      }),
    });
    if (!res.ok) return back('failed');
    idToken = ((await res.json()) as { id_token?: string }).id_token;
  } catch {
    return back('failed');
  }
  if (!idToken) return back('failed');

  const result = await verifyGoogleIdToken(idToken, env.GOOGLE_CLIENT_ID, saved.nonce, Math.floor(Date.now() / 1000));
  if (!result.ok) return back('failed');

  const user = await findOrCreateUser(env, result.email, result.sub);
  const session = await createSession(env, user.id);
  const headers = new Headers({ Location: `${env.APP_ORIGIN}/?signin=ok`, 'Cache-Control': 'no-store' });
  headers.append('Set-Cookie', session);
  headers.append('Set-Cookie', clearStateCookie);
  return new Response(null, { status: 302, headers });
}

async function signOut(request: Request, env: Env): Promise<Response> {
  const name = cookieName(env.APP_ORIGIN);
  const token = parseCookies(request.headers.get('Cookie'))[name];
  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256Hex(token)).run();
  }
  return json({ ok: true }, 200, { 'Set-Cookie': clearedCookie(name, isSecure(env)) });
}

interface ProgressRow {
  data: string;
  rev: number;
  epoch: number;
}

async function readProgress(env: Env, userId: string): Promise<{ rev: number; epoch: number; data: unknown }> {
  const row = await env.DB.prepare('SELECT data, rev, epoch FROM progress WHERE user_id = ?')
    .bind(userId)
    .first<ProgressRow>();
  if (!row) return { rev: 0, epoch: 0, data: null };
  return { rev: row.rev, epoch: row.epoch, data: JSON.parse(row.data) };
}

async function putProgress(request: Request, env: Env, user: SessionUser): Promise<Response> {
  const body = await readJson(request);
  if (
    !body ||
    !Number.isInteger(body.baseRev) ||
    !Number.isInteger(body.epoch) ||
    (body.baseRev as number) < 0 ||
    (body.epoch as number) < 0
  ) {
    return json({ error: 'invalid_request' }, 400);
  }
  const check = validateProgressData(body.data);
  if (!check.ok) return json({ error: 'invalid_progress', detail: check.error }, 400);
  if (!(await allow(env, `put:${user.id}`, 600, 3_600_000))) return json({ error: 'rate_limited' }, 429);

  const baseRev = body.baseRev as number;
  const epoch = body.epoch as number;
  const serialized = JSON.stringify(body.data);
  const now = Date.now();
  const conflict = async () => json({ error: 'conflict', ...(await readProgress(env, user.id)) }, 409);

  const existing = await env.DB.prepare('SELECT rev, epoch FROM progress WHERE user_id = ?')
    .bind(user.id)
    .first<{ rev: number; epoch: number }>();

  if (!existing) {
    if (baseRev !== 0) return conflict();
    const res = await env.DB.prepare(
      'INSERT OR IGNORE INTO progress (user_id, data, epoch, rev, updated_at) VALUES (?, ?, ?, 1, ?)'
    )
      .bind(user.id, serialized, epoch, now)
      .run();
    if (!res.meta.changes) return conflict();
    return json({ rev: 1, epoch });
  }

  if (baseRev !== existing.rev || epoch < existing.epoch) return conflict();
  const res = await env.DB.prepare(
    'UPDATE progress SET data = ?, epoch = ?, rev = rev + 1, updated_at = ? WHERE user_id = ? AND rev = ?'
  )
    .bind(serialized, epoch, now, user.id, baseRev)
    .run();
  if (!res.meta.changes) return conflict();
  return json({ rev: baseRev + 1, epoch });
}

async function deleteAccount(env: Env, user: SessionUser): Promise<Response> {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM progress WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM email_codes WHERE email = ?').bind(user.email),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id),
  ]);
  return json({ ok: true }, 200, { 'Set-Cookie': clearedCookie(cookieName(env.APP_ORIGIN), isSecure(env)) });
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);
    const method = request.method;

    // Cross-site requests cannot change anything.
    if (method !== 'GET' && method !== 'HEAD' && !isAllowedOrigin(request.headers.get('Origin'), env.APP_ORIGIN)) {
      return json({ error: 'forbidden_origin' }, 403);
    }

    if (Math.random() < 0.02) ctx.waitUntil(cleanup(env));

    try {
      switch (`${method} ${pathname}`) {
        case 'POST /api/auth/email/start':
          return await emailStart(request, env);
        case 'POST /api/auth/email/verify':
          return await emailVerify(request, env);
        case 'GET /api/auth/google/start':
          return await googleStart(env);
        case 'GET /api/auth/google/callback':
          return await googleCallback(request, env);
        case 'POST /api/auth/signout':
          return await signOut(request, env);
        case 'GET /api/auth/me': {
          const user = await currentUser(request, env);
          return user ? json({ user }) : json({ error: 'unauthenticated' }, 401);
        }
        case 'GET /api/progress': {
          const user = await currentUser(request, env);
          return user ? json(await readProgress(env, user.id)) : json({ error: 'unauthenticated' }, 401);
        }
        case 'PUT /api/progress': {
          const user = await currentUser(request, env);
          return user ? await putProgress(request, env, user) : json({ error: 'unauthenticated' }, 401);
        }
        case 'DELETE /api/account': {
          const user = await currentUser(request, env);
          return user ? await deleteAccount(env, user) : json({ error: 'unauthenticated' }, 401);
        }
        default:
          return json({ error: 'not_found' }, 404);
      }
    } catch (err) {
      console.error('api error', err);
      return json({ error: 'server_error' }, 500);
    }
  },
};
