/** Pure mapping from Poly Lens GraphQL payloads to the internal domain model. */
import type { Device, DeviceHealth, DeviceStatus, Room } from '../../domain/types';

export interface LensDevice {
  id: string;
  name?: string | null;
  hardwareFamily?: string | null;
  hardwareModel?: string | null;
  macAddress?: string | null;
  serialNumber?: string | null;
  softwareVersion?: string | null;
  connected?: boolean | null;
  hasPeripheralAlert?: boolean | null;
  lastDetected?: string | null;
  internalIp?: string | null;
  room?: { id: string; name?: string | null } | null;
  site?: { id: string; name?: string | null } | null;
}

export interface LensRoom {
  id: string;
  name?: string | null;
  capacity?: number | null;
  site?: { id: string } | null;
}

export function mapPolyDeviceStatus(raw: LensDevice): DeviceStatus {
  if (!raw.connected) return 'offline';
  return raw.hasPeripheralAlert ? 'degraded' : 'online';
}

export function mapPolyDevice(raw: LensDevice, fallbackSiteId: string): Device {
  return {
    id: `poly:${raw.id}`,
    vendor: 'poly',
    name: raw.name ?? raw.hardwareModel ?? raw.id,
    model: raw.hardwareModel ?? raw.hardwareFamily ?? 'Unknown',
    serialNumber: raw.serialNumber ?? '',
    macAddress: raw.macAddress ?? '',
    ipAddress: raw.internalIp ?? '',
    firmwareVersion: raw.softwareVersion ?? '',
    status: mapPolyDeviceStatus(raw),
    lastSeenAt: raw.lastDetected ?? new Date(0).toISOString(),
    siteId: raw.site ? `poly:${raw.site.id}` : fallbackSiteId,
    roomId: raw.room ? `poly:${raw.room.id}` : undefined,
    tags: raw.hardwareFamily ? [raw.hardwareFamily] : [],
  };
}

export function mapPolyRoom(raw: LensRoom, fallbackSiteId: string): Room {
  return {
    id: `poly:${raw.id}`,
    siteId: raw.site ? `poly:${raw.site.id}` : fallbackSiteId,
    name: raw.name ?? raw.id,
    capacity: raw.capacity ?? 0,
    vendorWorkspaceId: raw.id,
    vendor: 'poly',
  };
}

export function mapPolyDeviceHealth(raw: LensDevice): DeviceHealth {
  const status = mapPolyDeviceStatus(raw);
  const issues: string[] = [];
  if (!raw.connected) issues.push('Device offline in Poly Lens');
  if (raw.hasPeripheralAlert) issues.push('Peripheral alert active');
  return {
    deviceId: `poly:${raw.id}`,
    score: status === 'online' ? 100 : status === 'degraded' ? 65 : 0,
    issues,
    cpuPct: 0,
    memoryPct: 0,
    temperatureC: 0,
    uptimeHours: 0,
  };
}
