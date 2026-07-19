import { env } from '../env';
import type { SessionUser } from './session';

/**
 * OAuth2 authorization-code flow for Google and Microsoft. A provider is
 * "configured" only when both its client id and secret are present; otherwise
 * it is hidden from the UI and its routes report as unconfigured.
 */

export type ProviderId = 'google' | 'microsoft';

interface ProviderConfig {
  id: ProviderId;
  label: string;
  authUrl: string;
  tokenUrl: string;
  scope: string;
  clientId?: string;
  clientSecret?: string;
}

const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  google: {
    id: 'google',
    label: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
    clientId: env.googleClientId,
    clientSecret: env.googleClientSecret,
  },
  microsoft: {
    id: 'microsoft',
    label: 'Microsoft',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: 'openid email profile User.Read',
    clientId: env.microsoftClientId,
    clientSecret: env.microsoftClientSecret,
  },
};

export function isConfigured(id: ProviderId): boolean {
  const p = PROVIDERS[id];
  return Boolean(p.clientId && p.clientSecret);
}

export function configuredProviders(): { id: ProviderId; label: string }[] {
  return (Object.keys(PROVIDERS) as ProviderId[])
    .filter(isConfigured)
    .map((id) => ({ id, label: PROVIDERS[id].label }));
}

export function redirectUri(id: ProviderId, base: string): string {
  return `${base.replace(/\/$/, '')}/api/auth/${id}/callback`;
}

export function authorizeUrl(id: ProviderId, base: string, state: string): string {
  const p = PROVIDERS[id];
  const params = new URLSearchParams({
    client_id: p.clientId ?? '',
    redirect_uri: redirectUri(id, base),
    response_type: 'code',
    scope: p.scope,
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${p.authUrl}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  id_token?: string;
}

async function exchangeCode(id: ProviderId, code: string, base: string): Promise<string> {
  const p = PROVIDERS[id];
  const body = new URLSearchParams({
    client_id: p.clientId ?? '',
    client_secret: p.clientSecret ?? '',
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri(id, base),
  });
  const res = await fetch(p.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as TokenResponse;
  return data.access_token;
}

interface GoogleProfile {
  name?: string;
  email?: string;
  picture?: string;
}
interface MicrosoftProfile {
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
}

async function fetchProfile(id: ProviderId, accessToken: string): Promise<SessionUser> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  if (id === 'google') {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers });
    if (!res.ok) throw new Error(`Profile fetch failed (${res.status})`);
    const p = (await res.json()) as GoogleProfile;
    return {
      provider: 'google',
      name: p.name ?? p.email ?? 'Unknown',
      email: p.email ?? '',
      picture: p.picture,
    };
  }
  const res = await fetch('https://graph.microsoft.com/v1.0/me', { headers });
  if (!res.ok) throw new Error(`Profile fetch failed (${res.status})`);
  const p = (await res.json()) as MicrosoftProfile;
  return {
    provider: 'microsoft',
    name: p.displayName ?? p.userPrincipalName ?? 'Unknown',
    email: p.mail ?? p.userPrincipalName ?? '',
  };
}

export async function completeLogin(id: ProviderId, code: string, base: string): Promise<SessionUser> {
  const accessToken = await exchangeCode(id, code, base);
  return fetchProfile(id, accessToken);
}
