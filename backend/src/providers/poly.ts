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
  LensDevice,
  LensRoom,
  mapPolyDevice,
  mapPolyDeviceHealth,
  mapPolyRoom,
} from './mapping/poly';
import { DateRange, ProviderError, UcProvider } from './types';

const TOKEN_URL = 'https://login.lens.poly.com/oauth/token';
const GRAPHQL_URL = 'https://api.lens.poly.com/graphql';
const PAGE_SIZE = 100;

/** Devices Lens can't pin to a site are grouped under this synthetic site. */
const POLY_SITE_ID = 'poly:account';

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

interface GraphQlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

interface DeviceSearchData {
  deviceSearch: { pages: number; items: LensDevice[] };
}

interface RoomSearchData {
  roomSearch: { pages: number; items: LensRoom[] };
}

const DEVICE_FIELDS = `
  id name hardwareFamily hardwareModel macAddress serialNumber
  softwareVersion connected hasPeripheralAlert lastDetected internalIp
  room { id name } site { id name }`;

export class PolyProvider implements UcProvider {
  readonly vendor = 'poly' as const;

  private token: { value: string; expiresAt: number } | null = null;
  private lastSyncAt: string | null = null;
  private lastDeviceCount = 0;
  private lastError: string | null = null;

  constructor(
    private readonly clientId: string,
    private readonly apiSecret: string,
  ) {}

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) {
      return this.token.value;
    }
    const { data } = await fetchJson<TokenResponse>(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.apiSecret,
        audience: 'https://api.lens.poly.com',
      }),
    });
    this.token = {
      value: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return data.access_token;
  }

  private async query<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const token = await this.accessToken();
    const { data } = await fetchJson<GraphQlResponse<T>>(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });
    if (data.errors?.length) {
      throw new Error(data.errors.map((e) => e.message).join('; '));
    }
    if (!data.data) throw new Error('Empty GraphQL response');
    return data.data;
  }

  private fail(error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);
    this.lastError = message;
    throw new ProviderError('poly', `Poly Lens API: ${message}`);
  }

  async listDevices(): Promise<Device[]> {
    try {
      const items: LensDevice[] = [];
      let page = 1;
      let pages = 1;
      while (page <= pages) {
        const data = await this.query<DeviceSearchData>(
          `query Devices($page: Int, $pageSize: Int) {
             deviceSearch(params: { page: $page, pageSize: $pageSize }) {
               pages
               items { ${DEVICE_FIELDS} }
             }
           }`,
          { page, pageSize: PAGE_SIZE },
        );
        items.push(...data.deviceSearch.items);
        pages = data.deviceSearch.pages;
        page += 1;
      }
      const devices = items.map((d) => mapPolyDevice(d, POLY_SITE_ID));
      this.lastSyncAt = new Date().toISOString();
      this.lastDeviceCount = devices.length;
      this.lastError = null;
      return devices;
    } catch (error) {
      this.fail(error);
    }
  }

  async getDevice(id: string): Promise<Device | null> {
    const lensId = id.replace(/^poly:/, '');
    try {
      const data = await this.query<{ device: LensDevice | null }>(
        `query Device($id: ID!) { device(deviceId: $id) { ${DEVICE_FIELDS} } }`,
        { id: lensId },
      );
      return data.device ? mapPolyDevice(data.device, POLY_SITE_ID) : null;
    } catch (error) {
      this.fail(error);
    }
  }

  async listRooms(): Promise<Room[]> {
    try {
      const items: LensRoom[] = [];
      let page = 1;
      let pages = 1;
      while (page <= pages) {
        const data = await this.query<RoomSearchData>(
          `query Rooms($page: Int, $pageSize: Int) {
             roomSearch(params: { page: $page, pageSize: $pageSize }) {
               pages
               items { id name capacity site { id } }
             }
           }`,
          { page, pageSize: PAGE_SIZE },
        );
        items.push(...data.roomSearch.items);
        pages = data.roomSearch.pages;
        page += 1;
      }
      return items.map((r) => mapPolyRoom(r, POLY_SITE_ID));
    } catch (error) {
      this.fail(error);
    }
  }

  /** Poly Lens manages devices and rooms, not user directories. */
  async listUsers(): Promise<User[]> {
    return [];
  }

  /** Poly Lens has no number inventory; numbers come from the call platform. */
  async listPhoneNumbers(): Promise<PhoneNumber[]> {
    return [];
  }

  async getDeviceHealth(id: string): Promise<DeviceHealth | null> {
    const lensId = id.replace(/^poly:/, '');
    try {
      const data = await this.query<{ device: LensDevice | null }>(
        `query Device($id: ID!) { device(deviceId: $id) { ${DEVICE_FIELDS} } }`,
        { id: lensId },
      );
      return data.device ? mapPolyDeviceHealth(data.device) : null;
    } catch (error) {
      this.fail(error);
    }
  }

  /**
   * Lens exposes room/device usage insights, not per-call quality metrics, so
   * live mode has no call-quality series for Poly endpoints.
   */
  async getCallQuality(_range: DateRange): Promise<CallQualityPoint[]> {
    return [];
  }

  async syncStatus(): Promise<SyncStatus> {
    return {
      vendor: 'poly',
      lastSyncAt: this.lastSyncAt,
      inProgress: false,
      deviceCount: this.lastDeviceCount,
      error: this.lastError,
    };
  }
}
