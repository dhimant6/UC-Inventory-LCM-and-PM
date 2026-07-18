import type {
  CallQualityPoint,
  Device,
  DeviceHealth,
  PhoneNumber,
  Room,
  SyncStatus,
  User,
} from '../domain/types';
import { fetchJson } from './http';
import {
  GraphDeviceHealth,
  GraphRoom,
  GraphTeamworkDevice,
  GraphUser,
  mapTeamsDevice,
  mapTeamsDeviceHealth,
  mapTeamsRoom,
  mapTeamsUser,
  mapTeamsUserNumbers,
} from './mapping/teams';
import { DateRange, ProviderError, UcProvider } from './types';

const GRAPH = 'https://graph.microsoft.com/v1.0';

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

interface GraphPage<T> {
  value: T[];
  '@odata.nextLink'?: string;
}

interface PstnCallRecord {
  startDateTime: string;
  duration: number;
}

/** Devices Graph can't pin to a place are grouped under this synthetic site. */
const TEAMS_SITE_ID = 'teams:tenant';

export class MicrosoftTeamsProvider implements UcProvider {
  readonly vendor = 'teams' as const;

  private token: { value: string; expiresAt: number } | null = null;
  private lastSyncAt: string | null = null;
  private lastDeviceCount = 0;
  private lastError: string | null = null;

  constructor(
    private readonly tenantId: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {}

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) {
      return this.token.value;
    }
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });
    const { data } = await fetchJson<TokenResponse>(
      `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      },
    );
    this.token = {
      value: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return data.access_token;
  }

  /** Follow @odata.nextLink until the collection is exhausted. */
  private async getAllPages<T>(url: string): Promise<T[]> {
    const token = await this.accessToken();
    const items: T[] = [];
    let next: string | null = url;
    while (next) {
      const { data }: { data: GraphPage<T> } = await fetchJson<GraphPage<T>>(next, {
        headers: { Authorization: `Bearer ${token}` },
      });
      items.push(...data.value);
      next = data['@odata.nextLink'] ?? null;
    }
    return items;
  }

  private fail(error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);
    this.lastError = message;
    throw new ProviderError('teams', `Microsoft Graph: ${message}`);
  }

  async listDevices(): Promise<Device[]> {
    try {
      const raw = await this.getAllPages<GraphTeamworkDevice>(`${GRAPH}/teamwork/devices`);
      const devices = raw.map((d) => mapTeamsDevice(d, TEAMS_SITE_ID));
      this.lastSyncAt = new Date().toISOString();
      this.lastDeviceCount = devices.length;
      this.lastError = null;
      return devices;
    } catch (error) {
      this.fail(error);
    }
  }

  async getDevice(id: string): Promise<Device | null> {
    const graphId = id.replace(/^teams:/, '');
    try {
      const token = await this.accessToken();
      const { data } = await fetchJson<GraphTeamworkDevice>(
        `${GRAPH}/teamwork/devices/${encodeURIComponent(graphId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return mapTeamsDevice(data, TEAMS_SITE_ID);
    } catch (error) {
      this.fail(error);
    }
  }

  async listRooms(): Promise<Room[]> {
    try {
      const raw = await this.getAllPages<GraphRoom>(`${GRAPH}/places/microsoft.graph.room`);
      return raw.map((r) => mapTeamsRoom(r, TEAMS_SITE_ID));
    } catch (error) {
      this.fail(error);
    }
  }

  async listUsers(): Promise<User[]> {
    try {
      const raw = await this.getAllPages<GraphUser>(
        `${GRAPH}/users?$select=id,displayName,mail,userPrincipalName,jobTitle,officeLocation,businessPhones&$top=999`,
      );
      return raw.map((u) => mapTeamsUser(u, TEAMS_SITE_ID));
    } catch (error) {
      this.fail(error);
    }
  }

  async listPhoneNumbers(): Promise<PhoneNumber[]> {
    try {
      const raw = await this.getAllPages<GraphUser>(
        `${GRAPH}/users?$select=id,businessPhones&$top=999`,
      );
      return raw.flatMap(mapTeamsUserNumbers);
    } catch (error) {
      this.fail(error);
    }
  }

  async getDeviceHealth(id: string): Promise<DeviceHealth | null> {
    const graphId = id.replace(/^teams:/, '');
    try {
      const token = await this.accessToken();
      const { data } = await fetchJson<GraphDeviceHealth>(
        `${GRAPH}/teamwork/devices/${encodeURIComponent(graphId)}/health`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return mapTeamsDeviceHealth(id, data);
    } catch (error) {
      this.fail(error);
    }
  }

  /**
   * Aggregates PSTN call volume per day from the callRecords PSTN report.
   * Graph does not expose per-day MOS/jitter aggregates over REST (that data
   * lives in CQD), so quality fields are reported as 0 = "not reported".
   */
  async getCallQuality(range: DateRange): Promise<CallQualityPoint[]> {
    try {
      const from = `${range.from}T00:00:00Z`;
      const to = `${range.to}T23:59:59Z`;
      const raw = await this.getAllPages<PstnCallRecord>(
        `${GRAPH}/communications/callRecords/getPstnCalls(fromDateTime=${from},toDateTime=${to})`,
      );
      const byDay = new Map<string, number>();
      for (const record of raw) {
        const day = record.startDateTime.slice(0, 10);
        byDay.set(day, (byDay.get(day) ?? 0) + 1);
      }
      return [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, callCount]) => ({
          date,
          vendor: 'teams' as const,
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
      vendor: 'teams',
      lastSyncAt: this.lastSyncAt,
      inProgress: false,
      deviceCount: this.lastDeviceCount,
      error: this.lastError,
    };
  }
}
