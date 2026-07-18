import type {
  ActivityEvent,
  AppNotification,
  CallQualityPoint,
  ConnectorsResponse,
  Device,
  DeviceDetail,
  License,
  NumberRange,
  PhoneNumber,
  Project,
  ProjectDetail,
  Room,
  SavedView,
  SearchResults,
  Site,
  Summary,
  SyncResult,
  TestConnectionResult,
  TicketPoint,
  UptimePoint,
  User,
  Vendor,
} from './types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`);
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new ApiError(response.status, message);
  }
  return (await response.json()) as T;
}

async function post<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`, { method: 'POST' });
  if (!response.ok) {
    throw new ApiError(response.status, `Request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export const api = {
  summary: () => get<Summary>('/summary'),
  projects: () => get<Project[]>('/projects'),
  project: (id: string) => get<ProjectDetail>(`/projects/${encodeURIComponent(id)}`),
  devices: () => get<Device[]>('/devices'),
  device: (id: string) => get<DeviceDetail>(`/devices/${encodeURIComponent(id)}`),
  numbers: () => get<PhoneNumber[]>('/numbers'),
  numberRanges: () => get<NumberRange[]>('/number-ranges'),
  users: () => get<User[]>('/users'),
  sites: () => get<Site[]>('/sites'),
  rooms: () => get<Room[]>('/rooms'),
  licenses: () => get<License[]>('/licenses'),
  savedViews: () => get<SavedView[]>('/saved-views'),
  callQuality: (days = 90) => get<CallQualityPoint[]>(`/timeseries/call-quality?days=${days}`),
  uptime: (days = 90) => get<UptimePoint[]>(`/timeseries/uptime?days=${days}`),
  tickets: (days = 90) => get<TicketPoint[]>(`/timeseries/tickets?days=${days}`),
  activity: (limit = 60) => get<ActivityEvent[]>(`/activity?limit=${limit}`),
  notifications: () => get<AppNotification[]>('/notifications'),
  markNotificationRead: (id: string) =>
    post<AppNotification>(`/notifications/${encodeURIComponent(id)}/read`),
  markAllNotificationsRead: () => post<{ ok: boolean }>('/notifications/read-all'),
  search: (q: string) => get<SearchResults>(`/search?q=${encodeURIComponent(q)}`),
  connectors: () => get<ConnectorsResponse>('/connectors'),
  testConnection: (vendor: Vendor) => post<TestConnectionResult>(`/connectors/${vendor}/test`),
  syncConnector: (vendor: Vendor) => post<SyncResult>(`/connectors/${vendor}/sync`),
};
