/**
 * Pure mapping from Microsoft Graph payloads to the internal domain model.
 * No I/O here — the provider fetches, these functions translate.
 */
import type { Device, DeviceHealth, DeviceStatus, PhoneNumber, Room, User } from '../../domain/types';

export interface GraphTeamworkDevice {
  id: string;
  deviceType: string;
  healthStatus: 'unknown' | 'offline' | 'critical' | 'nonUrgent' | 'healthy';
  activityState: string;
  lastModifiedDateTime?: string;
  currentUser?: { id?: string; displayName?: string } | null;
  hardwareDetail?: {
    serialNumber?: string;
    uniqueId?: string;
    macAddresses?: string[];
    manufacturer?: string;
    model?: string;
  } | null;
}

export interface GraphUser {
  id: string;
  displayName?: string;
  mail?: string | null;
  userPrincipalName?: string;
  jobTitle?: string | null;
  officeLocation?: string | null;
  businessPhones?: string[];
}

export interface GraphRoom {
  id: string;
  displayName?: string;
  capacity?: number | null;
  building?: string | null;
}

export interface GraphDeviceHealth {
  connection?: { connectionStatus?: string } | null;
  loginStatus?: { exchangeConnection?: { connectionStatus?: string } | null } | null;
  peripheralsHealth?: Record<string, { connection?: { connectionStatus?: string } | null } | null> | null;
}

export function mapTeamsDeviceStatus(health: GraphTeamworkDevice['healthStatus']): DeviceStatus {
  switch (health) {
    case 'healthy':
      return 'online';
    case 'critical':
    case 'nonUrgent':
      return 'degraded';
    case 'offline':
    case 'unknown':
    default:
      return 'offline';
  }
}

export function mapTeamsDevice(raw: GraphTeamworkDevice, siteId: string): Device {
  const hw = raw.hardwareDetail ?? {};
  return {
    id: `teams:${raw.id}`,
    vendor: 'teams',
    name: raw.currentUser?.displayName
      ? `${hw.model ?? raw.deviceType} — ${raw.currentUser.displayName}`
      : (hw.model ?? raw.deviceType),
    model: hw.model ?? raw.deviceType,
    serialNumber: hw.serialNumber ?? hw.uniqueId ?? '',
    macAddress: hw.macAddresses?.[0] ?? '',
    // Graph does not expose the device IP; left blank rather than faked.
    ipAddress: '',
    firmwareVersion: '',
    status: mapTeamsDeviceStatus(raw.healthStatus),
    lastSeenAt: raw.lastModifiedDateTime ?? new Date(0).toISOString(),
    siteId,
    tags: [raw.deviceType],
  };
}

export function mapTeamsUser(raw: GraphUser, siteId: string): User {
  return {
    id: `teams:${raw.id}`,
    displayName: raw.displayName ?? raw.userPrincipalName ?? raw.id,
    email: raw.mail ?? raw.userPrincipalName ?? '',
    title: raw.jobTitle ?? '',
    siteId,
    licenseIds: [],
  };
}

export function mapTeamsRoom(raw: GraphRoom, siteId: string): Room {
  return {
    id: `teams:${raw.id}`,
    siteId,
    name: raw.displayName ?? raw.id,
    capacity: raw.capacity ?? 0,
    vendorWorkspaceId: raw.id,
    vendor: 'teams',
  };
}

/**
 * Graph has no REST surface for Teams Calling number inventory (that lives in
 * Teams PowerShell), so live mode surfaces users' published business phones.
 */
export function mapTeamsUserNumbers(raw: GraphUser): PhoneNumber[] {
  return (raw.businessPhones ?? [])
    .filter((n) => n.startsWith('+'))
    .map((n) => ({
      id: `teams:num:${n}`,
      e164: n.replace(/[^+\d]/g, ''),
      country: '',
      status: 'assigned' as const,
      carrier: 'Microsoft Calling Plan',
      rangeId: 'teams-calling-plan',
      assignedUserId: `teams:${raw.id}`,
    }));
}

export function mapTeamsDeviceHealth(deviceId: string, raw: GraphDeviceHealth): DeviceHealth {
  const issues: string[] = [];
  if (raw.connection?.connectionStatus && raw.connection.connectionStatus !== 'connected') {
    issues.push(`Device connection ${raw.connection.connectionStatus}`);
  }
  if (
    raw.loginStatus?.exchangeConnection?.connectionStatus &&
    raw.loginStatus.exchangeConnection.connectionStatus !== 'connected'
  ) {
    issues.push('Exchange sign-in unhealthy');
  }
  for (const [name, peripheral] of Object.entries(raw.peripheralsHealth ?? {})) {
    const status = peripheral?.connection?.connectionStatus;
    if (status && status !== 'connected') issues.push(`Peripheral ${name}: ${status}`);
  }
  const score = Math.max(0, 100 - issues.length * 20);
  return {
    deviceId,
    score,
    issues,
    // Graph device health does not report utilization; zeros mean "not reported".
    cpuPct: 0,
    memoryPct: 0,
    temperatureC: 0,
    uptimeHours: 0,
  };
}
