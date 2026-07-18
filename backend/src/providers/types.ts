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

export interface DateRange {
  /** ISO date, inclusive. */
  from: string;
  /** ISO date, inclusive. */
  to: string;
}

/**
 * The single seam between this app and any UC vendor. Every implementation
 * returns fully normalized domain objects; callers never see vendor payloads.
 */
export interface UcProvider {
  readonly vendor: Vendor;
  listDevices(): Promise<Device[]>;
  getDevice(id: string): Promise<Device | null>;
  listRooms(): Promise<Room[]>;
  listUsers(): Promise<User[]>;
  listPhoneNumbers(): Promise<PhoneNumber[]>;
  getDeviceHealth(id: string): Promise<DeviceHealth | null>;
  getCallQuality(range: DateRange): Promise<CallQualityPoint[]>;
  syncStatus(): Promise<SyncStatus>;
}

export class ProviderError extends Error {
  constructor(
    public readonly vendor: Vendor,
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
