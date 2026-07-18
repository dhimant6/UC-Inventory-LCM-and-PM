import type { Vendor } from './domain/types';
import { getProvider } from './providers/registry';
import { getStore } from './store';

export interface SyncResult {
  vendor: Vendor;
  ok: boolean;
  deviceCount: number | null;
  error: string | null;
  finishedAt: string;
}

/**
 * Pull fresh data from one vendor's provider into the store cache. Failures
 * are captured on the connector state — reads keep serving the last good
 * data, and this function never throws.
 */
export async function syncVendor(vendor: Vendor): Promise<SyncResult> {
  const store = getStore();
  const connector = store.connectors.find((c) => c.id === vendor);
  const started = Date.now();
  const provider = getProvider(vendor);
  if (!provider) {
    const error = 'Connector disabled: credentials not configured';
    if (connector) {
      connector.status = 'disabled';
      connector.lastError = error;
    }
    return { vendor, ok: false, deviceCount: null, error, finishedAt: new Date().toISOString() };
  }
  try {
    const devices = await provider.listDevices();
    const others = store.devices.filter((d) => d.vendor !== vendor);
    store.devices = [...others, ...devices];
    if (connector) {
      connector.status = 'connected';
      connector.lastSyncAt = new Date().toISOString();
      connector.lastError = null;
      connector.latencyMs = Date.now() - started;
    }
    return {
      vendor,
      ok: true,
      deviceCount: devices.length,
      error: null,
      finishedAt: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (connector) {
      connector.status = 'error';
      connector.lastError = message;
      connector.latencyMs = Date.now() - started;
    }
    return {
      vendor,
      ok: false,
      deviceCount: null,
      error: message,
      finishedAt: new Date().toISOString(),
    };
  }
}
