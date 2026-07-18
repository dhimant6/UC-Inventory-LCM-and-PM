import crypto from 'crypto';
import { Request, Response, Router } from 'express';
import { env } from '../env';
import { sendGuestAlert, sendLoginAlert } from '../auth/email';
import {
  ProviderId,
  authorizeUrl,
  completeLogin,
  configuredProviders,
  isConfigured,
} from '../auth/oauth';
import {
  SESSION_COOKIE,
  SESSION_TTL_SEC,
  STATE_COOKIE,
  readCookie,
  signSession,
  verifySession,
} from '../auth/session';
import { getStore } from '../store';

export const authRouter = Router();

function baseUrl(req: Request): string {
  if (env.appBaseUrl) return env.appBaseUrl;
  return `${req.protocol}://${req.get('host')}`;
}

function isProvider(value: string): value is ProviderId {
  return value === 'google' || value === 'microsoft';
}

const secureCookie = { httpOnly: true as const, sameSite: 'lax' as const, secure: true };

authRouter.get('/providers', (_req, res) => {
  res.json({ providers: configuredProviders() });
});

authRouter.get('/me', (req, res) => {
  const user = verifySession(readCookie(req.headers.cookie, SESSION_COOKIE));
  res.json({ user });
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, secureCookie);
  res.json({ ok: true });
});

// Guest entered the demo: alert the owner and log activity. Purely a
// notification — demo gating itself is client-side.
authRouter.post('/guest', (req, res) => {
  const raw = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const name = raw.slice(0, 60) || 'Anonymous';
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '';
  void sendGuestAlert(name, { ip, userAgent: req.get('user-agent') ?? '' });
  try {
    getStore().activity.unshift({
      id: `guest-${Date.now()}`,
      at: new Date().toISOString(),
      type: 'user.added',
      actor: name,
      message: `${name} opened the demo`,
      entityType: 'user',
      entityId: 'guest',
    });
  } catch {
    // best-effort
  }
  res.json({ ok: true });
});

// Kick off the OAuth flow: set a signed state cookie, redirect to the provider.
authRouter.get('/:provider', (req, res) => {
  const provider = req.params.provider;
  if (!isProvider(provider) || !isConfigured(provider)) {
    res.status(404).json({ error: 'Provider not configured' });
    return;
  }
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie(STATE_COOKIE, `${provider}:${state}`, { ...secureCookie, maxAge: 600_000 });
  res.redirect(authorizeUrl(provider, baseUrl(req), state));
});

// OAuth callback: verify state, exchange code, issue session, alert, redirect.
authRouter.get('/:provider/callback', async (req: Request, res: Response) => {
  const provider = req.params.provider;
  const redirectHome = (q = '') => res.redirect(`/${q}`);
  if (!isProvider(provider) || !isConfigured(provider)) {
    redirectHome('?auth=error');
    return;
  }
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const cookieState = readCookie(req.headers.cookie, STATE_COOKIE);
  res.clearCookie(STATE_COOKIE, secureCookie);
  if (!code || !state || cookieState !== `${provider}:${state}`) {
    redirectHome('?auth=error');
    return;
  }
  try {
    const user = await completeLogin(provider, code, baseUrl(req));
    res.cookie(SESSION_COOKIE, signSession(user), {
      ...secureCookie,
      maxAge: SESSION_TTL_SEC * 1000,
    });

    // Side effects: email the owner and log an in-app activity event.
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '';
    void sendLoginAlert(user, { ip, userAgent: req.get('user-agent') ?? '' });
    try {
      getStore().activity.unshift({
        id: `login-${Date.now()}`,
        at: new Date().toISOString(),
        type: 'user.added',
        actor: user.name,
        message: `${user.name} signed in via ${provider}`,
        entityType: 'user',
        entityId: user.email,
      });
    } catch {
      // Activity log is best-effort.
    }
    redirectHome('?auth=success');
  } catch (error) {
    console.error('[auth] callback failed:', error);
    redirectHome('?auth=error');
  }
});
