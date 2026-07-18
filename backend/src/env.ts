import crypto from 'crypto';
import dotenv from 'dotenv';
import type { DataSource } from './domain/types';

dotenv.config();

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : undefined;
}

const dataSource: DataSource = optional('DATA_SOURCE') === 'live' ? 'live' : 'mock';

export const env = {
  port: Number(optional('PORT') ?? 4000),
  dataSource,

  // Live connector credentials (Teams/Webex/Poly device sync).
  msTenantId: optional('MS_TENANT_ID'),
  msClientId: optional('MS_CLIENT_ID'),
  msClientSecret: optional('MS_CLIENT_SECRET'),
  webexAccessToken: optional('WEBEX_ACCESS_TOKEN'),
  polyLensClientId: optional('POLY_LENS_CLIENT_ID'),
  polyLensApiSecret: optional('POLY_LENS_API_SECRET'),

  // Sign-in (OAuth) — kept distinct from the Teams connector creds above.
  // Absolute base URL used to build OAuth redirect URIs; falls back to the
  // incoming request host when unset.
  appBaseUrl: optional('APP_BASE_URL'),
  // Stable secret so session cookies survive restarts; random per-boot if unset.
  sessionSecret: optional('SESSION_SECRET') ?? crypto.randomBytes(32).toString('hex'),
  googleClientId: optional('GOOGLE_CLIENT_ID'),
  googleClientSecret: optional('GOOGLE_CLIENT_SECRET'),
  microsoftClientId: optional('MICROSOFT_CLIENT_ID'),
  microsoftClientSecret: optional('MICROSOFT_CLIENT_SECRET'),

  // Login-alert email (Resend).
  resendApiKey: optional('RESEND_API_KEY'),
  alertEmailTo: optional('ALERT_EMAIL_TO'),
  alertEmailFrom: optional('ALERT_EMAIL_FROM') ?? 'Fleetline <onboarding@resend.dev>',
} as const;

export type Env = typeof env;
