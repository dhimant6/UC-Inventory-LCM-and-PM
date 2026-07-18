/** Mirrors of the backend's normalized domain model, as served by the API. */

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
  country: string;
  timezone: string;
  lat: number;
  lng: number;
  roomCount: number;
  deviceCount: number;
  userCount: number;
  offlineCount: number;
}

export interface Room {
  id: string;
  siteId: string;
  name: string;
  capacity: number;
  devices: Device[];
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  title: string;
  siteId: string;
  licenseIds: string[];
  numberCount: number;
}

export interface License {
  id: string;
  sku: string;
  displayName: string;
  vendor: Vendor;
  total: number;
  assigned: number;
  renewsAt: string;
  monthlyCostUsd: number;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  startDate: string;
  targetDate: string;
  owner: string;
  description: string;
  siteIds: string[];
  progress: number;
  deviceCount: number;
  numberCount: number;
}

export interface DeviceHealth {
  deviceId: string;
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
  lastSeenAt: string;
  siteId: string;
  roomId?: string;
  projectId?: string;
  tags: string[];
}

export interface DeviceDetail extends Device {
  health: DeviceHealth | null;
  site: Omit<Site, 'roomCount' | 'deviceCount' | 'userCount' | 'offlineCount'> | null;
  room: { id: string; name: string; capacity: number } | null;
  project: Omit<Project, 'deviceCount' | 'numberCount'> | null;
  numbers: PhoneNumber[];
}

export interface NumberRange {
  id: string;
  label: string;
  carrier: string;
  country: string;
  first: string;
  last: string;
  size: number;
  assigned: number;
  porting: number;
}

export interface PhoneNumber {
  id: string;
  e164: string;
  country: string;
  status: NumberStatus;
  carrier: string;
  rangeId: string;
  assignedUserId?: string;
  assignedDeviceId?: string;
  projectId?: string;
  portingTargetDate?: string;
}

export interface CallQualityPoint {
  date: string;
  vendor: Vendor;
  mosAvg: number;
  jitterMsP95: number;
  packetLossPct: number;
  callCount: number;
  poorCallPct: number;
}

export interface UptimePoint {
  date: string;
  vendor: Vendor;
  uptimePct: number;
  onlineCount: number;
  offlineCount: number;
  degradedCount: number;
}

export interface TicketPoint {
  date: string;
  opened: number;
  resolved: number;
  backlog: number;
}

export interface ActivityEvent {
  id: string;
  at: string;
  type: string;
  actor: string;
  message: string;
  entityType: 'device' | 'number' | 'project' | 'connector' | 'user';
  entityId: string;
}

export interface AppNotification {
  id: string;
  at: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  body: string;
  read: boolean;
}

export interface SavedView {
  id: string;
  name: string;
  screen: 'devices' | 'numbers' | 'projects';
  description: string;
  filters: Record<string, string>;
}

export interface ConnectorState {
  id: Vendor;
  displayName: string;
  source: DataSource;
  status: ConnectorStatus;
  lastSyncAt: string | null;
  lastError: string | null;
  latencyMs: number | null;
  credentials: { name: string; configured: boolean }[];
}

export interface ConnectorsResponse {
  dataSource: DataSource;
  connectors: ConnectorState[];
}

export interface TestConnectionResult {
  vendor: Vendor;
  ok: boolean;
  latencyMs: number;
  deviceCount: number | null;
  error: string | null;
}

export interface SyncResult {
  vendor: Vendor;
  ok: boolean;
  deviceCount: number | null;
  error: string | null;
  finishedAt: string;
}

export interface Summary {
  devices: { total: number; online: number; degraded: number; offline: number };
  numbers: {
    total: number;
    assigned: number;
    unassigned: number;
    reserved: number;
    porting: number;
  };
  projects: {
    total: number;
    planning: number;
    inFlight: number;
    blocked: number;
    complete: number;
    overdue: number;
  };
  sites: number;
  users: number;
  mosToday: number;
  ticketBacklog: number;
  unreadNotifications: number;
}

export interface SearchResults {
  devices: Device[];
  numbers: PhoneNumber[];
  projects: Project[];
  users: User[];
  sites: Site[];
}

export interface ProjectDetail extends Omit<Project, 'deviceCount' | 'numberCount'> {
  devices: Device[];
  numbers: PhoneNumber[];
  sites: { id: string; name: string; city: string; country: string }[];
}
