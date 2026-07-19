import type { ConnectorState, Vendor } from '../domain/types';
import { env } from '../env';
import { getStore } from '../store';
import { MicrosoftTeamsProvider } from './microsoftTeams';
import { MockProvider } from './mock';
import { PolyProvider } from './poly';
import { UcProvider } from './types';
import { WebexProvider } from './webex';

const VENDORS: readonly Vendor[] = ['teams', 'webex', 'poly'];

interface CredentialSpec {
  name: string;
  value: string | undefined;
}

function credentialSpecs(vendor: Vendor): CredentialSpec[] {
  switch (vendor) {
    case 'teams':
      return [
        { name: 'MS_TENANT_ID', value: env.msTenantId },
        { name: 'MS_CLIENT_ID', value: env.msClientId },
        { name: 'MS_CLIENT_SECRET', value: env.msClientSecret },
      ];
    case 'webex':
      return [{ name: 'WEBEX_ACCESS_TOKEN', value: env.webexAccessToken }];
    case 'poly':
      return [
        { name: 'POLY_LENS_CLIENT_ID', value: env.polyLensClientId },
        { name: 'POLY_LENS_API_SECRET', value: env.polyLensApiSecret },
      ];
  }
}

function buildLiveProvider(vendor: Vendor): UcProvider | null {
  const creds = credentialSpecs(vendor);
  if (creds.some((c) => !c.value)) return null;
  switch (vendor) {
    case 'teams':
      return new MicrosoftTeamsProvider(env.msTenantId!, env.msClientId!, env.msClientSecret!);
    case 'webex':
      return new WebexProvider(env.webexAccessToken!);
    case 'poly':
      return new PolyProvider(env.polyLensClientId!, env.polyLensApiSecret!);
  }
}

const providers = new Map<Vendor, UcProvider | null>();

/**
 * Resolve the provider for a vendor. In mock mode every vendor gets a
 * MockProvider; in live mode a vendor without complete credentials resolves
 * to null and is surfaced as `disabled` in connector state.
 */
export function getProvider(vendor: Vendor): UcProvider | null {
  if (!providers.has(vendor)) {
    providers.set(
      vendor,
      env.dataSource === 'mock' ? new MockProvider(vendor) : buildLiveProvider(vendor),
    );
  }
  return providers.get(vendor) ?? null;
}

export function allVendors(): readonly Vendor[] {
  return VENDORS;
}

const DISPLAY_NAMES: Record<Vendor, string> = {
  teams: 'Microsoft Teams',
  webex: 'Cisco Webex',
  poly: 'Poly Lens',
};

/**
 * Connector state as shown on the settings page. Mock mode reports the
 * seeded states (including the intentional webex error); live mode reflects
 * real credential presence and last sync results.
 */
export async function connectorStates(): Promise<ConnectorState[]> {
  if (env.dataSource === 'mock') {
    return getStore().connectors.map((c) => ({
      ...c,
      credentials: credentialSpecs(c.id).map((s) => ({
        name: s.name,
        configured: Boolean(s.value),
      })),
    }));
  }
  const states: ConnectorState[] = [];
  for (const vendor of VENDORS) {
    const provider = getProvider(vendor);
    const creds = credentialSpecs(vendor);
    if (!provider) {
      states.push({
        id: vendor,
        displayName: DISPLAY_NAMES[vendor],
        source: 'live',
        status: 'disabled',
        lastSyncAt: null,
        lastError: 'Missing credentials',
        latencyMs: null,
        credentials: creds.map((s) => ({ name: s.name, configured: Boolean(s.value) })),
      });
      continue;
    }
    const sync = await provider.syncStatus();
    states.push({
      id: vendor,
      displayName: DISPLAY_NAMES[vendor],
      source: 'live',
      status: sync.error ? 'error' : 'connected',
      lastSyncAt: sync.lastSyncAt,
      lastError: sync.error,
      latencyMs: null,
      credentials: creds.map((s) => ({ name: s.name, configured: Boolean(s.value) })),
    });
  }
  return states;
}

export interface TestConnectionResult {
  vendor: Vendor;
  ok: boolean;
  latencyMs: number;
  deviceCount: number | null;
  error: string | null;
}

/** Run a cheap end-to-end call against the provider and report the outcome. */
export async function testConnection(vendor: Vendor): Promise<TestConnectionResult> {
  const provider = getProvider(vendor);
  const started = Date.now();
  if (!provider) {
    return {
      vendor,
      ok: false,
      latencyMs: 0,
      deviceCount: null,
      error: 'Connector disabled: credentials not configured',
    };
  }
  try {
    const devices = await provider.listDevices();
    return {
      vendor,
      ok: true,
      latencyMs: Date.now() - started,
      deviceCount: devices.length,
      error: null,
    };
  } catch (error) {
    return {
      vendor,
      ok: false,
      latencyMs: Date.now() - started,
      deviceCount: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
