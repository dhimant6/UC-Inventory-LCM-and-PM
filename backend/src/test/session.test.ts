import { describe, expect, it } from 'vitest';
import { readCookie, signSession, verifySession } from '../auth/session';

describe('session tokens', () => {
  const user = { provider: 'google' as const, name: 'Ada Lovelace', email: 'ada@example.com' };

  it('round-trips a signed session', () => {
    const token = signSession(user);
    expect(verifySession(token)).toEqual(user);
  });

  it('rejects a tampered token', () => {
    const token = signSession(user);
    const tampered = `${token.slice(0, -2)}xy`;
    expect(verifySession(tampered)).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = signSession(user, -1);
    expect(verifySession(token)).toBeNull();
  });

  it('rejects garbage and undefined', () => {
    expect(verifySession(undefined)).toBeNull();
    expect(verifySession('not-a-token')).toBeNull();
  });

  it('reads a named cookie from the header', () => {
    expect(readCookie('a=1; fl_session=abc.def; b=2', 'fl_session')).toBe('abc.def');
    expect(readCookie(undefined, 'fl_session')).toBeUndefined();
  });
});
