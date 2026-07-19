/** Pure mapping from Webex API payloads to the internal domain model. */
import type { Device, DeviceHealth, DeviceStatus, NumberStatus, PhoneNumber, Room, User } from '../../domain/types';

export interface WebexDevice {
  id: string;
  displayName?: string;
  product?: string;
  type?: string;
  mac?: string;
  ip?: string;
  serial?: string;
  software?: string;
  connectionStatus?: string;
  workspaceId?: string;
  personId?: string;
  tags?: string[];
  created?: string;
}

export interface WebexWorkspace {
  id: string;
  displayName?: string;
  capacity?: number;
  workspaceLocationId?: string;
}

export interface WebexPerson {
  id: string;
  displayName?: string;
  emails?: string[];
  title?: string;
}

export interface WebexNumber {
  phoneNumber?: string;
  state?: string;
  phoneNumberType?: string;
  mainNumber?: boolean;
  owner?: { id?: string; type?: string } | null;
  location?: { id?: string; name?: string } | null;
}

export function mapWebexDeviceStatus(connectionStatus: string | undefined): DeviceStatus {
  switch (connectionStatus) {
    case 'connected':
      return 'online';
    case 'connected_with_issues':
      return 'degraded';
    case 'disconnected':
    case 'offline':
    case 'unknown':
    default:
      return 'offline';
  }
}

export function mapWebexDevice(raw: WebexDevice, siteId: string): Device {
  const product = raw.product ?? raw.type ?? 'Unknown';
  const tags = [...(raw.tags ?? [])];
  // Cisco room hardware managed via Control Hub that runs Microsoft Teams Rooms.
  if (/MTR|Microsoft Teams Room|Room Kit|Room Bar/i.test(`${product} ${raw.displayName ?? ''}`)) {
    tags.push('mtr');
  }
  return {
    id: `webex:${raw.id}`,
    vendor: 'webex',
    name: raw.displayName ?? raw.product ?? raw.id,
    model: product,
    serialNumber: raw.serial ?? '',
    macAddress: raw.mac ?? '',
    ipAddress: raw.ip ?? '',
    firmwareVersion: raw.software ?? '',
    status: mapWebexDeviceStatus(raw.connectionStatus),
    // Webex list payloads carry no last-seen; use created as the floor.
    lastSeenAt: raw.created ?? new Date(0).toISOString(),
    siteId,
    roomId: raw.workspaceId ? `webex:${raw.workspaceId}` : undefined,
    tags,
  };
}

export function mapWebexWorkspace(raw: WebexWorkspace, siteId: string): Room {
  return {
    id: `webex:${raw.id}`,
    siteId,
    name: raw.displayName ?? raw.id,
    capacity: raw.capacity ?? 0,
    vendorWorkspaceId: raw.id,
    vendor: 'webex',
  };
}

export function mapWebexPerson(raw: WebexPerson, siteId: string): User {
  return {
    id: `webex:${raw.id}`,
    displayName: raw.displayName ?? raw.id,
    email: raw.emails?.[0] ?? '',
    title: raw.title ?? '',
    siteId,
    licenseIds: [],
  };
}

export function mapWebexNumberStatus(raw: WebexNumber): NumberStatus {
  if (raw.state === 'INACTIVE') return 'reserved';
  return raw.owner ? 'assigned' : 'unassigned';
}

export function mapWebexNumber(raw: WebexNumber): PhoneNumber | null {
  if (!raw.phoneNumber) return null;
  const e164 = raw.phoneNumber.replace(/[^+\d]/g, '');
  return {
    id: `webex:num:${e164}`,
    e164,
    country: '',
    status: mapWebexNumberStatus(raw),
    carrier: 'Webex Calling',
    rangeId: raw.location?.id ? `webex:${raw.location.id}` : 'webex-unlocated',
    assignedUserId:
      raw.owner?.type === 'PEOPLE' && raw.owner.id ? `webex:${raw.owner.id}` : undefined,
  };
}

export function mapWebexDeviceHealth(raw: WebexDevice): DeviceHealth {
  const status = mapWebexDeviceStatus(raw.connectionStatus);
  const issues =
    status === 'online'
      ? []
      : status === 'degraded'
        ? ['Connected with issues reported by Webex']
        : ['Device disconnected'];
  return {
    deviceId: `webex:${raw.id}`,
    score: status === 'online' ? 100 : status === 'degraded' ? 60 : 0,
    issues,
    cpuPct: 0,
    memoryPct: 0,
    temperatureC: 0,
    uptimeHours: 0,
  };
}
