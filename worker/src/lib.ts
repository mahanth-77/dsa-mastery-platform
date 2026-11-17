/**
 * Pure helpers for the VERTEX account API.
 *
 * Nothing in this file touches Cloudflare bindings, so it runs (and is tested)
 * under plain Node. Everything security-sensitive lives here on purpose.
 */

export const CODE_TTL_MS = 10 * 60 * 1000;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_CODE_ATTEMPTS = 5;
/** D1 rows are capped at 2 MB; stay well under it. */
export const MAX_PROGRESS_BYTES = 1_500_000;

const STATUS_VALUES = new Set(['not_started', 'attempted', 'solved', 'revisit']);

// ─── Email ───────────────────────────────────────────────────────────────────

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(raw: unknown): raw is string {
  if (typeof raw !== 'string') return false;
  const e = raw.trim();
  if (e.length < 5 || e.length > 254) return false;
  if (/\s/.test(e)) return false;
  // Deliberately simple: one @, something on both sides, a dot in the domain.
  return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e);
}

// ─── Randomness and hashing ──────────────────────────────────────────────────

/** Uniform 6-digit code (rejection sampling, so no modulo bias). */
export function generateCode(): string {
  const limit = 4294967296 - (4294967296 % 1000000);
  const buf = new Uint32Array(1);
  let n = 0;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= limit);
  return String(n % 1000000).padStart(6, '0');
}

export function base64UrlEncode(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecodeToString(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  const bytes = new Uint8Array(digest);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

/** Constant-time comparison of two equal-purpose hex strings. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** The stored form of a sign-in code: bound to the email and a server secret. */
export function codeDigest(email: string, code: string, pepper: string): Promise<string> {
  return sha256Hex(`${normalizeEmail(email)}:${code}:${pepper}`);
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

// ─── Google ID token claims ──────────────────────────────────────────────────

export function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(base64UrlDecodeToString(parts[1]));
    return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Verify Google's RS256 ID-token signature against its published JWKS before trusting claims. */
export async function verifyGoogleIdToken(
  jwt: string, clientId: string, expectedNonce: string, nowSec: number, fetcher: typeof fetch = fetch
): Promise<GoogleClaimResult> {
  const parts = jwt.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed_token' };
  try {
    const header = JSON.parse(base64UrlDecodeToString(parts[0])) as Record<string, unknown>;
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) return { ok: false, reason: 'bad_token_header' };
    const response = await fetcher('https://www.googleapis.com/oauth2/v3/certs', { headers: { Accept: 'application/json' } });
    if (!response.ok) return { ok: false, reason: 'jwks_unavailable' };
    const jwks = await response.json() as { keys?: Array<JsonWebKey & { kid?: string; alg?: string; use?: string }> };
    const jwk = jwks.keys?.find(key => key.kid === header.kid && key.kty === 'RSA' && (!key.use || key.use === 'sig'));
    if (!jwk) return { ok: false, reason: 'unknown_signing_key' };
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const encoded = parts[2].replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(encoded + '='.repeat((4 - (encoded.length % 4)) % 4));
    const signature = Uint8Array.from(binary, char => char.charCodeAt(0));
    const input = new TextEncoder().encode(parts[0] + '.' + parts[1]);
    if (!(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, input))) return { ok: false, reason: 'bad_signature' };
    return checkGoogleClaims(decodeJwtPayload(jwt), clientId, expectedNonce, nowSec);
  } catch {
    return { ok: false, reason: 'token_verification_failed' };
  }
}

export type GoogleClaimResult =
  | { ok: true; sub: string; email: string }
  | { ok: false; reason: string };

/**
 * The ID token is received straight from Google's token endpoint over TLS, which
 * OpenID Connect allows us to trust without re-verifying the signature. We still
 * validate who it is for, who issued it, that it is fresh, and that the email is verified.
 */
export function checkGoogleClaims(
  claims: Record<string, unknown> | null,
  clientId: string,
  expectedNonce: string,
  nowSec: number
): GoogleClaimResult {
  if (!claims) return { ok: false, reason: 'unreadable_token' };
  const iss = claims.iss;
  if (iss !== 'https://accounts.google.com' && iss !== 'accounts.google.com') return { ok: false, reason: 'bad_issuer' };
  const aud = claims.aud;
  const audOk = Array.isArray(aud) ? aud.includes(clientId) : aud === clientId;
  if (!audOk || (typeof claims.azp === 'string' && claims.azp !== clientId)) return { ok: false, reason: 'bad_audience' };
  if (Array.isArray(aud) && aud.length > 1 && claims.azp !== clientId) return { ok: false, reason: 'bad_authorized_party' };
  if (typeof claims.exp !== 'number' || claims.exp <= nowSec) return { ok: false, reason: 'expired' };
  if (typeof claims.iat !== 'number' || claims.iat > nowSec + 60 || nowSec - claims.iat > 3600) return { ok: false, reason: 'bad_issued_at' };
  if (typeof claims.nonce !== 'string' || !timingSafeEqual(claims.nonce, expectedNonce)) return { ok: false, reason: 'bad_nonce' };
  if (typeof claims.sub !== 'string' || !claims.sub) return { ok: false, reason: 'no_subject' };
  if (typeof claims.email !== 'string' || !isValidEmail(claims.email)) return { ok: false, reason: 'no_email' };
  if (claims.email_verified !== true) return { ok: false, reason: 'email_unverified' };
  return { ok: true, sub: claims.sub, email: normalizeEmail(claims.email) };
}

// ─── Cookies and request checks ──────────────────────────────────────────────

export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k && !(k in out)) out[k] = v;
  }
  return out;
}

/** `__Host-` prefix needs HTTPS; on http://localhost we fall back to a plain name. */
export function cookieName(appOrigin: string): string {
  return appOrigin.startsWith('https://') ? '__Host-vertex_sid' : 'vertex_sid';
}

export function sessionCookie(name: string, token: string, maxAgeSec: number, secure: boolean): string {
  return `${name}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure ? '; Secure' : ''}`;
}

export function clearedCookie(name: string, secure: boolean): string {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
}

/** Short-lived browser binding for the OAuth authorization response. */
export function oauthStateCookie(state: string, secure: boolean): string {
  return `vertex_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure ? '; Secure' : ''}`;
}

export function clearedOauthStateCookie(secure: boolean): string {
  return `vertex_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
}

/** State-changing requests must come from our own origin (CSRF defence in depth). */
export function isAllowedOrigin(originHeader: string | null, appOrigin: string): boolean {
  return !!originHeader && originHeader === appOrigin;
}

// ─── Progress payload validation ─────────────────────────────────────────────

export type ValidationResult = { ok: true } | { ok: false; error: string };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Shape and size checks for the progress blob a client wants to store. */
export function validateProgressData(data: unknown): ValidationResult {
  if (!isPlainObject(data)) return { ok: false, error: 'progress must be an object' };
  const { problems, activity, settings } = data;
  if (!isPlainObject(problems)) return { ok: false, error: 'problems must be an object' };
  if (!Array.isArray(activity)) return { ok: false, error: 'activity must be an array' };
  if (!isPlainObject(settings)) return { ok: false, error: 'settings must be an object' };

  const ids = Object.keys(problems);
  if (ids.length > 5000) return { ok: false, error: 'too many problems' };
  if (activity.length > 50000) return { ok: false, error: 'too much activity' };
  for (const id of ids) {
    const p = problems[id];
    if (!isPlainObject(p)) return { ok: false, error: `problem ${id} is malformed` };
    if (typeof p.status !== 'string' || !STATUS_VALUES.has(p.status)) {
      return { ok: false, error: `problem ${id} has an invalid status` };
    }
  }
  // D1 stores UTF-8 text; JS string length counts UTF-16 code units, not bytes.
  const size = new TextEncoder().encode(JSON.stringify(data)).byteLength;
  if (size > MAX_PROGRESS_BYTES) return { ok: false, error: 'progress is too large' };
  return { ok: true };
}
