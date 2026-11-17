import { describe, expect, it } from 'vitest';
import {
  checkGoogleClaims,
  clearedOauthStateCookie,
  oauthStateCookie,
  validateProgressData,
  verifyGoogleIdToken,
} from './lib';

const now = 1_800_000_000;
const clientId = 'vertex-test-client.apps.googleusercontent.com';
const nonce = 'nonce-from-this-browser';

function encode(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signedGoogleToken() {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  );
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const header = encode({ alg: 'RS256', kid: 'test-key-1', typ: 'JWT' });
  const payload = encode({
    iss: 'https://accounts.google.com',
    aud: clientId,
    sub: 'google-user-123',
    email: 'verified@example.com',
    email_verified: true,
    exp: now + 300,
    iat: now,
    nonce,
  });
  const input = header + '.' + payload;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, new TextEncoder().encode(input));
  return {
    jwt: input + '.' + encodeBytes(new Uint8Array(signature)),
    jwk: { ...jwk, kid: 'test-key-1', alg: 'RS256', use: 'sig' },
    privateKey: pair.privateKey,
    input,
  };
}

describe('Google OIDC verification', () => {
  it('accepts a correctly signed token with matching audience, nonce and verified email', async () => {
    const token = await signedGoogleToken();
    const fetcher = (async () => new Response(JSON.stringify({ keys: [token.jwk] }), { status: 200 })) as typeof fetch;
    const result = await verifyGoogleIdToken(token.jwt, clientId, nonce, now, fetcher);
    expect(result).toEqual({ ok: true, sub: 'google-user-123', email: 'verified@example.com' });
  });

  it('rejects a token with a modified signature', async () => {
    const token = await signedGoogleToken();
    const parts = token.jwt.split('.');
    parts[2] = (parts[2][0] === 'A' ? 'B' : 'A') + parts[2].slice(1);
    const fetcher = (async () => new Response(JSON.stringify({ keys: [token.jwk] }), { status: 200 })) as typeof fetch;
    const result = await verifyGoogleIdToken(parts.join('.'), clientId, nonce, now, fetcher);
    expect(result).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('rejects a token whose nonce belongs to another login attempt', async () => {
    const token = await signedGoogleToken();
    const fetcher = (async () => new Response(JSON.stringify({ keys: [token.jwk] }), { status: 200 })) as typeof fetch;
    const result = await verifyGoogleIdToken(token.jwt, clientId, 'different-nonce', now, fetcher);
    expect(result).toEqual({ ok: false, reason: 'bad_nonce' });
  });

  it('rejects an invalid authorized party and stale issued-at claim', () => {
    const base = {
      iss: 'https://accounts.google.com', aud: [clientId, 'other-client'], azp: 'other-client',
      sub: 'subject', email: 'verified@example.com', email_verified: true,
      exp: now + 300, iat: now, nonce,
    };
    expect(checkGoogleClaims(base, clientId, nonce, now)).toEqual({ ok: false, reason: 'bad_audience' });
    expect(checkGoogleClaims({ ...base, aud: clientId, azp: undefined, iat: now - 3601 }, clientId, nonce, now))
      .toEqual({ ok: false, reason: 'bad_issued_at' });
  });
});

describe('OAuth browser binding cookies', () => {
  it('sets short-lived HttpOnly SameSite=Lax state cookie with Secure on HTTPS', () => {
    expect(oauthStateCookie('opaque-state', true)).toContain('HttpOnly; SameSite=Lax; Max-Age=600; Secure');
  });

  it('clears the OAuth state cookie after callback', () => {
    expect(clearedOauthStateCookie(true)).toContain('vertex_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure');
  });
});

describe('progress payload byte limits', () => {
  it('measures UTF-8 bytes rather than UTF-16 string length', () => {
    const result = validateProgressData({ problems: {}, activity: [], settings: { note: '😀'.repeat(400_000) } });
    expect(result).toEqual({ ok: false, error: 'progress is too large' });
  });
});
