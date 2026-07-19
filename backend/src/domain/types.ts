/**
 * Internal normalized domain model. Every vendor payload is mapped into these
 * shapes at the provider boundary; nothing past that boundary knows or cares
 * which vendor a record came from beyond the `vendor` discriminator.
 */

export type Vendor = 'teams' | 'webex' | 'poly';

export type DeviceStatus = 'online' | 'offline' | 'degraded';

export type ProjectStatus = 'planning' | 'in-flight' | 'blocked' | 'complete';

export type NumberStatus = 'assigned' | 'unassigned' | 'reserved' | 'porting';

export type ConnectorStatus = 'connected' | 'error' | 'disabled';

export type DataSource = 'mock' | 'live';

export interface Site {
  id: string;
  name: string;
  city: string;
  country: string; // ISO 3166-1 alpha-2
  timezone: string;
  lat: number;
  lng: number;
}

export interface Room {
  id: string;
  siteId: string;
  name: string;
  capacity: number;
  /** Vendor-side workspace/place identifier, when the room is vendor-managed. */
  vendorWorkspaceId?: string;
  vendor?: Vendor;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  title: string;
  siteId: string;
  licenseIds: string[];
}

export interface License {
  id: string;
  sku: string;
  displayName: string;
  vendor: Vendor;
  total: number;
  assigned: number;
  renewsAt: string; // ISO date
  monthlyCostUsd: number;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  startDate: string; // ISO date
  targetDate: string; // ISO date
  owner: string;
  description: string;
  siteIds: string[];
  /** 0..100 rollout completion. */
  progress: number;
}

export interface DeviceHealth {
  deviceId: string;
  /** 0..100 composite score. */
  score: number;
  issues: string[];
  cpuPct: number;
  memoryPct: number;
  temperatureC: number;
  uptimeHours: number;
}

export interface Device {
  id: string;
  vendor: Vendor;
  name: string;
  model: string;
  serialNumber: string;
  macAddress: string;
  ipAddress: string;
  firmwareVersion: string;
  status: DeviceStatus;
  lastSeenAt: string; // ISO datetime
  siteId: string;
  roomId?: string;
  projectId?: string;
  tags: string[];
}

export interface NumberRange {
  id: string;
  label: string;
  carrier: string;
  country: string;
  first: string; // E.164
  last: string; // E.164
  size: number;
}

export interface PhoneNumber {
  id: string;
  e164: string;
  country: string; // ISO 3166-1 alpha-2
  status: NumberStatus;
  carrier: string;
  rangeId: string;
  assignedUserId?: string;
  assignedDeviceId?: string;
  projectId?: string;
  /** Present while status === 'porting'. */
  portingTargetDate?: string;
}

export interface CallQualityPoint {
  date: string; // ISO date
  vendor: Vendor;
  mosAvg: number;
  jitterMsP95: number;
  packetLossPct: number;
  callCount: number;
  poorCallPct: number;
}

export interface UptimePoint {
  date: string; // ISO date
  vendor: Vendor;
  uptimePct: number;
  onlineCount: number;
  offlineCount: number;
  degradedCount: number;
}

export interface TicketPoint {
  date: string; // ISO date
  opened: number;
  resolved: number;
  backlog: number;
}

export type ActivityType =
  | 'device.online'
  | 'device.offline'
  | 'device.firmware'
  | 'number.assigned'
  | 'number.ported'
  | 'project.status'
  | 'connector.sync'
  | 'connector.error'
  | 'user.added';

export interface ActivityEvent {
  id: string;
  at: string; // ISO datetime
  type: ActivityType;
  actor: string;
  message: string;
  entityType: 'device' | 'number' | 'project' | 'connector' | 'user';
  entityId: string;
}

export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface AppNotification {
  id: string;
  at: string;
  severity: NotificationSeverity;
  title: string;
  body: string;
  read: boolean;
}

export interface SavedView {
  id: string;
  name: string;
  screen: 'devices' | 'numbers' | 'projects';
  description: string;
  /** Query-string style filters the screen applies verbatim. */
  filters: Record<string, string>;
}

export interface SyncStatus {
  vendor: Vendor;
  lastSyncAt: string | null;
  inProgress: boolean;
  deviceCount: number;
  error: string | null;
}

export interface ConnectorState {
  id: Vendor;
  displayName: string;
  source: DataSource;
  status: ConnectorStatus;
  lastSyncAt: string | null;
  lastError: string | null;
  latencyMs: number | null;
  /** Names of env vars the live provider needs, and whether each is set. */
  credentials: { name: string; configured: boolean }[];
}
