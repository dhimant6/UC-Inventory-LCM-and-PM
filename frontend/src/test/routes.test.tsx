/**
 * Route smoke tests: every page renders its populated state against a mocked
 * API without crashing. The 3D hero is stubbed (no WebGL in jsdom).
 */
import { render, screen } from '@testing-library/react';
import { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../lib/theme';

vi.mock('../components/hero3d', () => ({
  default: () => <div data-testid="hero3d-stub" />,
}));

import ActivityPage from '../pages/ActivityPage';
import ConnectorsPage from '../pages/ConnectorsPage';
import DashboardPage from '../pages/DashboardPage';
import DevicesPage from '../pages/DevicesPage';
import LicensesPage from '../pages/LicensesPage';
import NotFoundPage from '../pages/NotFoundPage';
import NumbersPage from '../pages/NumbersPage';
import ProjectsPage from '../pages/ProjectsPage';
import SitesPage from '../pages/SitesPage';
import UsersPage from '../pages/UsersPage';

const site = {
  id: 'site-1',
  name: 'London HQ',
  city: 'London',
  country: 'GB',
  timezone: 'Europe/London',
  lat: 51.5,
  lng: -0.13,
  roomCount: 4,
  deviceCount: 10,
  userCount: 12,
  offlineCount: 1,
};

const device = {
  id: 'poly:dev-1',
  vendor: 'poly',
  name: 'Boardroom — Poly Studio X70',
  model: 'Poly Studio X70',
  serialNumber: '8L21AB12CD',
  macAddress: 'AA:BB:CC:DD:EE:FF',
  ipAddress: '10.10.1.20',
  firmwareVersion: '4.2.1-411057',
  status: 'online',
  lastSeenAt: new Date().toISOString(),
  siteId: 'site-1',
  roomId: 'room-1',
  projectId: 'proj-1',
  tags: ['room-system'],
};

const FIXTURES: Record<string, unknown> = {
  '/api/summary': {
    devices: { total: 150, online: 123, degraded: 12, offline: 15 },
    numbers: { total: 400, assigned: 248, unassigned: 96, reserved: 56, porting: 67 },
    projects: { total: 8, planning: 2, inFlight: 3, blocked: 1, complete: 2, overdue: 1 },
    sites: 6,
    users: 48,
    mosToday: 4.21,
    ticketBacklog: 22,
    unreadNotifications: 3,
  },
  '/api/devices': [device],
  '/api/sites': [site],
  '/api/rooms': [{ id: 'room-1', siteId: 'site-1', name: 'Boardroom', capacity: 12, devices: [device] }],
  '/api/users': [
    {
      id: 'user-1',
      displayName: 'Amelia Walker',
      email: 'amelia.walker@example.com',
      title: 'AV Engineer',
      siteId: 'site-1',
      licenseIds: ['lic-1'],
      numberCount: 1,
    },
  ],
  '/api/licenses': [
    {
      id: 'lic-1',
      sku: 'MTR-PRO',
      displayName: 'Teams Rooms Pro',
      vendor: 'teams',
      total: 60,
      assigned: 41,
      renewsAt: '2027-02-11',
      monthlyCostUsd: 40,
    },
  ],
  '/api/projects': [
    {
      id: 'proj-1',
      name: 'Global MTR Refresh Wave 2',
      client: 'Northwind Financial',
      status: 'in-flight',
      startDate: '2026-03-20',
      targetDate: '2026-09-01',
      owner: 'Amelia Walker',
      description: 'Refresh',
      siteIds: ['site-1'],
      progress: 62,
      deviceCount: 40,
      numberCount: 80,
    },
  ],
  '/api/numbers': [
    {
      id: 'num-1',
      e164: '+442033000100',
      country: 'GB',
      status: 'assigned',
      carrier: 'BT Wholesale',
      rangeId: 'range-1',
      assignedUserId: 'user-1',
    },
  ],
  '/api/number-ranges': [
    {
      id: 'range-1',
      label: 'GB DID block +44203300xx',
      carrier: 'BT Wholesale',
      country: 'GB',
      first: '+442033000100',
      last: '+442033000199',
      size: 67,
      assigned: 40,
      porting: 0,
    },
  ],
  '/api/saved-views': [
    {
      id: 'view-1',
      name: 'Offline room systems',
      screen: 'devices',
      description: 'Room devices currently offline.',
      filters: { status: 'offline' },
    },
  ],
  '/api/activity': [
    {
      id: 'act-1',
      at: new Date().toISOString(),
      type: 'device.offline',
      actor: 'system',
      message: 'Boardroom device went offline',
      entityType: 'device',
      entityId: 'poly:dev-1',
    },
  ],
  '/api/notifications': [
    {
      id: 'ntf-1',
      at: new Date().toISOString(),
      severity: 'critical',
      title: 'Webex connector authentication failed',
      body: 'Token rejected.',
      read: false,
    },
  ],
  '/api/connectors': {
    dataSource: 'mock',
    connectors: [
      {
        id: 'webex',
        displayName: 'Cisco Webex',
        source: 'mock',
        status: 'error',
        lastSyncAt: new Date().toISOString(),
        lastError: '401 Unauthorized: access token expired',
        latencyMs: null,
        credentials: [{ name: 'WEBEX_ACCESS_TOKEN', configured: false }],
      },
    ],
  },
};

function fixtureFor(url: string): unknown {
  const path = url.split('?')[0];
  if (path.startsWith('/api/timeseries/call-quality')) {
    return [
      { date: '2026-07-17', vendor: 'teams', mosAvg: 4.3, jitterMsP95: 8, packetLossPct: 0.1, callCount: 200, poorCallPct: 1 },
    ];
  }
  if (path.startsWith('/api/timeseries/uptime')) {
    return [
      { date: '2026-07-17', vendor: 'teams', uptimePct: 97.5, onlineCount: 48, offlineCount: 1, degradedCount: 1 },
    ];
  }
  if (path.startsWith('/api/timeseries/tickets')) {
    return [{ date: '2026-07-17', opened: 9, resolved: 7, backlog: 22 }];
  }
  if (path.startsWith('/api/devices/')) {
    return { ...device, health: null, site, room: null, project: null, numbers: [] };
  }
  return FIXTURES[path];
}

function renderPage(element: ReactElement) {
  return render(
    <ThemeProvider>
      <MemoryRouter>{element}</MemoryRouter>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const data = fixtureFor(url);
      if (data === undefined) {
        return new Response(JSON.stringify({ error: `No fixture for ${url}` }), { status: 404 });
      }
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('route smoke tests', () => {
  it('Dashboard renders populated stats', async () => {
    renderPage(<DashboardPage />);
    expect(await screen.findByText('123/150')).toBeInTheDocument();
    expect(screen.getByText('Saved views')).toBeInTheDocument();
  });

  it('Projects renders the table', async () => {
    renderPage(<ProjectsPage />);
    // The responsive table renders both desktop and card views into the DOM.
    expect((await screen.findAllByText('Global MTR Refresh Wave 2')).length).toBeGreaterThan(0);
  });

  it('Devices renders the table', async () => {
    renderPage(<DevicesPage />);
    expect((await screen.findAllByText('Boardroom — Poly Studio X70')).length).toBeGreaterThan(0);
  });

  it('Numbers renders the table and ranges', async () => {
    renderPage(<NumbersPage />);
    expect((await screen.findAllByText(/\+442|\+44 /)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('GB DID block +44203300xx')).length).toBeGreaterThan(0);
  });

  it('Users renders the directory', async () => {
    renderPage(<UsersPage />);
    expect((await screen.findAllByText('Amelia Walker')).length).toBeGreaterThan(0);
  });

  it('Sites renders sites and rooms', async () => {
    renderPage(<SitesPage />);
    expect((await screen.findAllByText('London HQ')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Boardroom')).length).toBeGreaterThan(0);
  });

  it('Licences renders entitlements', async () => {
    renderPage(<LicensesPage />);
    expect((await screen.findAllByText('Teams Rooms Pro')).length).toBeGreaterThan(0);
  });

  it('Connectors renders status incl. the error state', async () => {
    renderPage(<ConnectorsPage />);
    expect(await screen.findByText('Cisco Webex')).toBeInTheDocument();
    expect(screen.getByText('401 Unauthorized: access token expired')).toBeInTheDocument();
  });

  it('Activity renders the audit log', async () => {
    renderPage(<ActivityPage />);
    expect(await screen.findByText('Boardroom device went offline')).toBeInTheDocument();
  });

  it('NotFound renders', () => {
    renderPage(<NotFoundPage />);
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });
});
