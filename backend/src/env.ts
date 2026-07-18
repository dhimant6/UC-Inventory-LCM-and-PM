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

  msTenantId: optional('MS_TENANT_ID'),
  msClientId: optional('MS_CLIENT_ID'),
  msClientSecret: optional('MS_CLIENT_SECRET'),

  webexAccessToken: optional('WEBEX_ACCESS_TOKEN'),

  polyLensClientId: optional('POLY_LENS_CLIENT_ID'),
  polyLensApiSecret: optional('POLY_LENS_API_SECRET'),
} as const;

export type Env = typeof env;
