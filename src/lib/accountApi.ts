import type { UserProgress } from '../types';

/** Thin client for the VERTEX account API (the Cloudflare Worker, reached at /api). */

export interface AccountUser {
  id: string;
  email: string;
}

export interface RemoteProgress {
  rev: number;
  epoch: number;
  data: UserProgress | null;
}

export class ApiError extends Error {
  status: number;
  code: string;
  body: any;
  constructor(status: number, code: string, body: any) {
    super(code);
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const type = res.headers.get('Content-Type') || '';
  const payload = type.includes('application/json') ? await res.json().catch(() => null) : null;
  if (!res.ok) throw new ApiError(res.status, (payload && payload.error) || `http_${res.status}`, payload);
  if (payload === null) throw new ApiError(res.status, 'not_json', null);
  return payload as T;
}

export const accountApi = {
  me: () => call<{ user: AccountUser }>('GET', '/api/auth/me'),
  emailStart: (email: string) => call<{ ok: true }>('POST', '/api/auth/email/start', { email }),
  emailVerify: (email: string, code: string) =>
    call<{ user: AccountUser }>('POST', '/api/auth/email/verify', { email, code }),
  signOut: () => call<{ ok: true }>('POST', '/api/auth/signout', {}),
  getProgress: () => call<RemoteProgress>('GET', '/api/progress'),
  putProgress: (baseRev: number, epoch: number, data: UserProgress) =>
    call<{ rev: number; epoch: number }>('PUT', '/api/progress', { baseRev, epoch, data }),
  deleteAccount: () => call<{ ok: true }>('DELETE', '/api/account'),
};

/** Where the browser goes to start Google sign-in (a full-page navigation). */
export const GOOGLE_START_URL = '/api/auth/google/start';
