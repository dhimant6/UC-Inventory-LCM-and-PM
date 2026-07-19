import type {
  CallQualityPoint,
  Device,
  DeviceHealth,
  PhoneNumber,
  Room,
  SyncStatus,
  User,
} from '../domain/types';
import { fetchJson, nextLink } from './http';
import {
  WebexDevice,
  WebexNumber,
  WebexPerson,
  WebexWorkspace,
  mapWebexDevice,
  mapWebexDeviceHealth,
  mapWebexNumber,
  mapWebexPerson,
  mapWebexWorkspace,
} from './mapping/webex';
import { DateRange, ProviderError, UcProvider } from './types';

const API = 'https://webexapis.com/v1';

/** Devices Webex can't pin to a workspace location fall under this site. */
const WEBEX_SITE_ID = 'webex:org';

interface CdrRecord {
  'Start time'?: string;
  Duration?: number;
}

export class WebexProvider implements UcProvider {
  readonly vendor = 'webex' as const;

  private lastSyncAt: string | null = null;
  private lastDeviceCount = 0;
  private lastError: string | null = null;

  constructor(private readonly accessToken: string) {}

  private headers(): Record<string, string> {
    return { Authorization: `Bearer ${this.accessToken}` };
  }

  /** Webex paginates with RFC 5988 Link headers; follow rel="next". */
  private async getAllPages<T>(url: string, itemsKey: string): Promise<T[]> {
    const items: T[] = [];
    let next: string | null = url;
    while (next) {
      const { data, headers } = await fetchJson<Record<string, T[]>>(next, {
        headers: this.headers(),
      });
      items.push(...(data[itemsKey] ?? []));
      next = nextLink(headers);
    }
    return items;
  }

  private fail(error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);
    this.lastError = message;
    throw new ProviderError('webex', `Webex API: ${message}`);
  }

  async listDevices(): Promise<Device[]> {
    try {
      const raw = await this.getAllPages<WebexDevice>(`${API}/devices?max=100`, 'items');
      const devices = raw.map((d) => mapWebexDevice(d, WEBEX_SITE_ID));
      this.lastSyncAt = new Date().toISOString();
      this.lastDeviceCount = devices.length;
      this.lastError = null;
      return devices;
    } catch (error) {
      this.fail(error);
    }
  }

  async getDevice(id: string): Promise<Device | null> {
    const webexId = id.replace(/^webex:/, '');
    try {
      const { data } = await fetchJson<WebexDevice>(
        `${API}/devices/${encodeURIComponent(webexId)}`,
        { headers: this.headers() },
      );
      return mapWebexDevice(data, WEBEX_SITE_ID);
    } catch (error) {
      this.fail(error);
    }
  }

  async listRooms(): Promise<Room[]> {
    try {
      const raw = await this.getAllPages<WebexWorkspace>(`${API}/workspaces?max=100`, 'items');
      return raw.map((w) => mapWebexWorkspace(w, WEBEX_SITE_ID));
    } catch (error) {
      this.fail(error);
    }
  }

  async listUsers(): Promise<User[]> {
    try {
      const raw = await this.getAllPages<WebexPerson>(`${API}/people?max=100`, 'items');
      return raw.map((p) => mapWebexPerson(p, WEBEX_SITE_ID));
    } catch (error) {
      this.fail(error);
    }
  }

  async listPhoneNumbers(): Promise<PhoneNumber[]> {
    try {
      const raw = await this.getAllPages<WebexNumber>(
        `${API}/telephony/config/numbers?max=2000`,
        'phoneNumbers',
      );
      return raw
        .map(mapWebexNumber)
        .filter((n): n is PhoneNumber => n !== null);
    } catch (error) {
      this.fail(error);
    }
  }

  async getDeviceHealth(id: string): Promise<DeviceHealth | null> {
    const webexId = id.replace(/^webex:/, '');
    try {
      const { data } = await fetchJson<WebexDevice>(
        `${API}/devices/${encodeURIComponent(webexId)}`,
        { headers: this.headers() },
      );
      return mapWebexDeviceHealth(data);
    } catch (error) {
      this.fail(error);
    }
  }

  /**
   * Aggregates daily call volume from the Webex Calling detailed call history
   * feed. Per-day MOS aggregates are not exposed over public REST (Control
   * Hub analytics only), so quality fields are reported as 0 = "not reported".
   */
  async getCallQuality(range: DateRange): Promise<CallQualityPoint[]> {
    try {
      const url =
        `https://analytics.webexapis.com/v1/cdr_feed?startTime=${range.from}T00:00:00.000Z` +
        `&endTime=${range.to}T23:59:59.000Z`;
      const { data } = await fetchJson<{ items?: CdrRecord[] }>(url, {
        headers: this.headers(),
      });
      const byDay = new Map<string, number>();
      for (const record of data.items ?? []) {
        const day = record['Start time']?.slice(0, 10);
        if (day) byDay.set(day, (byDay.get(day) ?? 0) + 1);
      }
      return [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, callCount]) => ({
          date,
          vendor: 'webex' as const,
          mosAvg: 0,
          jitterMsP95: 0,
          packetLossPct: 0,
          callCount,
          poorCallPct: 0,
        }));
    } catch (error) {
      this.fail(error);
    }
  }

  async syncStatus(): Promise<SyncStatus> {
    return {
      vendor: 'webex',
      lastSyncAt: this.lastSyncAt,
      inProgress: false,
      deviceCount: this.lastDeviceCount,
      error: this.lastError,
    };
  }
}
