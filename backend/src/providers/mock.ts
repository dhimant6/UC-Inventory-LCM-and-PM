import type {
  CallQualityPoint,
  Device,
  DeviceHealth,
  PhoneNumber,
  Room,
  SyncStatus,
  User,
  Vendor,
} from '../domain/types';
import { getStore } from '../store';
import { DateRange, ProviderError, UcProvider } from './types';

/**
 * Serves the deterministic seed dataset through the same interface as the
 * live providers. One instance per vendor, so the rest of the app treats
 * mock and live identically. A vendor whose seeded connector state is
 * `error` throws exactly like a failing live provider would, which keeps
 * the UI's degradation paths honest in mock mode.
 */
export class MockProvider implements UcProvider {
  constructor(readonly vendor: Vendor) {}

  private failIfErrored(): void {
    const connector = getStore().connectors.find((c) => c.id === this.vendor);
    if (connector?.status === 'error') {
      throw new ProviderError(this.vendor, connector.lastError ?? 'Connector in error state', 401);
    }
  }

  async listDevices(): Promise<Device[]> {
    this.failIfErrored();
    return getStore().devices.filter((d) => d.vendor === this.vendor);
  }

  async getDevice(id: string): Promise<Device | null> {
    this.failIfErrored();
    return getStore().devices.find((d) => d.id === id && d.vendor === this.vendor) ?? null;
  }

  async listRooms(): Promise<Room[]> {
    this.failIfErrored();
    const { rooms, devices } = getStore();
    const roomIds = new Set(
      devices.filter((d) => d.vendor === this.vendor && d.roomId).map((d) => d.roomId),
    );
    return rooms.filter((r) => roomIds.has(r.id));
  }

  async listUsers(): Promise<User[]> {
    this.failIfErrored();
    return getStore().users;
  }

  async listPhoneNumbers(): Promise<PhoneNumber[]> {
    this.failIfErrored();
    return getStore().numbers;
  }

  async getDeviceHealth(id: string): Promise<DeviceHealth | null> {
    this.failIfErrored();
    return getStore().deviceHealth.get(id) ?? null;
  }

  async getCallQuality(range: DateRange): Promise<CallQualityPoint[]> {
    this.failIfErrored();
    return getStore().callQuality.filter(
      (p) => p.vendor === this.vendor && p.date >= range.from && p.date <= range.to,
    );
  }

  async syncStatus(): Promise<SyncStatus> {
    const store = getStore();
    const connector = store.connectors.find((c) => c.id === this.vendor);
    return {
      vendor: this.vendor,
      lastSyncAt: connector?.lastSyncAt ?? null,
      inProgress: false,
      deviceCount: store.devices.filter((d) => d.vendor === this.vendor).length,
      error: connector?.status === 'error' ? connector.lastError : null,
    };
  }
}
