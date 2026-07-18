import crypto from 'crypto';
import { env } from '../env';

/**
 * Minimal stateless session: an HMAC-SHA256 signed token in an httpOnly
 * cookie. No database — the signed payload is the session. A stable
 * SESSION_SECRET keeps sessions valid across restarts.
 */

export interface SessionUser {
  provider: 'google' | 'microsoft';
  name: string;
  email: string;
  picture?: string;
}

interface TokenBody extends SessionUser {
  exp: number;
}

const COOKIE = 'fl_session';
const TTL_SEC = 60 * 60 * 24 * 7; // 7 days

function b64u(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function hmac(data: string): string {
  return crypto.createHmac('sha256', env.sessionSecret).update(data).digest('base64url');
}

export function signSession(user: SessionUser, ttlSec = TTL_SEC): string {
  const body: TokenBody = { ...user, exp: Math.floor(Date.now() / 1000) + ttlSec };
  const data = b64u(JSON.stringify(body));
  return `${data}.${hmac(data)}`;
}

export function verifySession(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = hmac(data);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const body = JSON.parse(Buffer.from(data, 'base64url').toString()) as TokenBody;
    if (body.exp < Math.floor(Date.now() / 1000)) return null;
    const { exp: _exp, ...user } = body;
    return user;
  } catch {
    return null;
  }
}

/** Read a named cookie from the raw Cookie header (no cookie-parser dep). */
export function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

export const SESSION_COOKIE = COOKIE;
export const STATE_COOKIE = 'fl_oauth_state';
export const SESSION_TTL_SEC = TTL_SEC;
