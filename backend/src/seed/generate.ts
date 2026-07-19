/**
 * Deterministic seed dataset. Everything derives from one fixed PRNG seed;
 * dates are offsets from the boot-time anchor so "last seen 4 minutes ago"
 * stays fresh while the shape of the data never changes between runs.
 */
import type {
  ActivityEvent,
  ActivityType,
  AppNotification,
  CallQualityPoint,
  ConnectorState,
  Device,
  DeviceHealth,
  DeviceStatus,
  License,
  NumberRange,
  PhoneNumber,
  Project,
  Room,
  SavedView,
  Site,
  TicketPoint,
  UptimePoint,
  User,
  Vendor,
} from '../domain/types';
import { Rng } from './random';

export interface SeedData {
  sites: Site[];
  rooms: Room[];
  users: User[];
  licenses: License[];
  projects: Project[];
  devices: Device[];
  deviceHealth: Map<string, DeviceHealth>;
  numberRanges: NumberRange[];
  numbers: PhoneNumber[];
  callQuality: CallQualityPoint[];
  uptime: UptimePoint[];
  tickets: TicketPoint[];
  activity: ActivityEvent[];
  notifications: AppNotification[];
  savedViews: SavedView[];
  connectors: ConnectorState[];
}

const DAY_MS = 86_400_000;

const SITE_DEFS = [
  { name: 'London HQ', city: 'London', country: 'GB', timezone: 'Europe/London', lat: 51.5074, lng: -0.1278 },
  { name: 'New York Hub', city: 'New York', country: 'US', timezone: 'America/New_York', lat: 40.7128, lng: -74.006 },
  { name: 'Frankfurt Campus', city: 'Frankfurt', country: 'DE', timezone: 'Europe/Berlin', lat: 50.1109, lng: 8.6821 },
  { name: 'Singapore Office', city: 'Singapore', country: 'SG', timezone: 'Asia/Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Sydney Office', city: 'Sydney', country: 'AU', timezone: 'Australia/Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Toronto Office', city: 'Toronto', country: 'CA', timezone: 'America/Toronto', lat: 43.6532, lng: -79.3832 },
] as const;

interface ModelDef {
  vendor: Vendor;
  model: string;
  firmware: readonly string[];
  serialPrefix: string;
}

const MODEL_DEFS: readonly ModelDef[] = [
  { vendor: 'poly', model: 'Poly Studio X50', firmware: ['4.2.1-411057', '4.1.3-402150', '4.3.0-420015'], serialPrefix: '8L20' },
  { vendor: 'poly', model: 'Poly Studio X70', firmware: ['4.2.1-411057', '4.3.0-420015'], serialPrefix: '8L21' },
  { vendor: 'poly', model: 'Poly G7500', firmware: ['4.1.3-402150', '4.2.1-411057'], serialPrefix: '8G75' },
  { vendor: 'poly', model: 'Poly Trio C60', firmware: ['8.0.2.1041', '8.0.1.1017', '7.2.5.8033'], serialPrefix: '8T60' },
  { vendor: 'webex', model: 'Cisco Room Kit Pro', firmware: ['RoomOS 11.14.1.5', 'RoomOS 11.13.2.3'], serialPrefix: 'FOC2' },
  { vendor: 'webex', model: 'Cisco Room Bar', firmware: ['RoomOS 11.14.1.5', 'RoomOS 11.12.1.7'], serialPrefix: 'FOC3' },
  { vendor: 'webex', model: 'Cisco Desk Pro', firmware: ['RoomOS 11.14.1.5', 'RoomOS 11.13.2.3'], serialPrefix: 'FOC4' },
  { vendor: 'teams', model: 'Teams Rooms MTR-W (Lenovo Core)', firmware: ['4.19.62.0', '4.18.99.0'], serialPrefix: 'LNV1' },
  { vendor: 'teams', model: 'Teams Rooms MTR-W (Logitech Rally Bar)', firmware: ['4.19.62.0', '4.17.42.0'], serialPrefix: 'LGT9' },
  { vendor: 'teams', model: 'Yealink MP54 Teams Phone', firmware: ['122.15.0.36', '122.14.0.30'], serialPrefix: 'YLK5' },
] as const;

const ROOM_NAMES = [
  'Boardroom', 'Huddle 1', 'Huddle 2', 'Huddle 3', 'Auditorium', 'Focus 1',
  'Focus 2', 'Training Room', 'War Room', 'Innovation Lab', 'Client Suite',
  'Meeting Room A', 'Meeting Room B', 'Meeting Room C', 'Meeting Room D',
  'Quiet Room', 'All-Hands Space', 'Studio', 'Briefing Room', 'Sky Lounge',
] as const;

const FIRST_NAMES = [
  'Amelia', 'Noah', 'Priya', 'Lucas', 'Yuki', 'Fatima', 'Oliver', 'Sofia',
  'Mateo', 'Ingrid', 'Chen', 'Aisha', 'Liam', 'Zara', 'Hugo', 'Nadia',
  'Ethan', 'Mei', 'Omar', 'Clara', 'Felix', 'Anya', 'Marcus', 'Leila',
] as const;

const LAST_NAMES = [
  'Walker', 'Schmidt', 'Tan', 'Okafor', 'Novak', 'Silva', 'Haugen', 'Rossi',
  'Kim', 'Petrov', 'Dubois', 'Nakamura', 'Ali', 'Johansson', 'Costa', 'Weber',
  'Lindqvist', 'Moreau', 'Santos', 'Berg', 'Fischer', 'Olsen', 'Mancini', 'Kaur',
] as const;

const TITLES = [
  'AV Engineer', 'Workplace Technology Lead', 'IT Support Specialist',
  'Collaboration Architect', 'Network Engineer', 'Facilities Manager',
  'UC Administrator', 'Service Desk Analyst', 'Project Coordinator',
  'Field Engineer',
] as const;

const CLIENTS = [
  'Northwind Financial', 'Contoso Energy', 'Fabrikam Health', 'Adventure Works',
  'Tailspin Logistics', 'Proseware Legal', 'Woodgrove Bank', 'Litware Retail',
] as const;

const PROJECT_OWNERS = [
  'Amelia Walker', 'Marcus Fischer', 'Priya Tan', 'Hugo Moreau',
] as const;

interface CountryNumbering {
  country: string;
  prefix: string;
  carrier: string;
  subscriberDigits: number;
}

const NUMBERING: readonly CountryNumbering[] = [
  { country: 'GB', prefix: '+4420', carrier: 'BT Wholesale', subscriberDigits: 8 },
  { country: 'US', prefix: '+1212', carrier: 'Verizon Business', subscriberDigits: 7 },
  { country: 'DE', prefix: '+4969', carrier: 'Deutsche Telekom', subscriberDigits: 8 },
  { country: 'SG', prefix: '+656', carrier: 'Singtel', subscriberDigits: 7 },
  { country: 'AU', prefix: '+612', carrier: 'Telstra', subscriberDigits: 8 },
  { country: 'CA', prefix: '+1416', carrier: 'Bell Canada', subscriberDigits: 7 },
] as const;

/** Microsoft Teams Rooms systems — from Teams-native and Cisco (Webex) hardware. */
const MTR_PATTERN = /MTR|Teams Rooms|Room Kit|Room Bar/i;

export function deviceTags(model: string): string[] {
  if (model.includes('Phone')) return ['desk-phone'];
  const tags = ['room-system'];
  if (MTR_PATTERN.test(model)) tags.push('mtr');
  return tags;
}

function isoDay(anchor: number, dayOffset: number): string {
  return new Date(anchor + dayOffset * DAY_MS).toISOString().slice(0, 10);
}

function round(value: number, places: number): number {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

export function generateSeedData(seed = 20260718, anchorMs = Date.now()): SeedData {
  const rng = new Rng(seed);

  // --- Sites ---
  const sites: Site[] = SITE_DEFS.map((def, i) => ({ id: `site-${i + 1}`, ...def }));

  // --- Rooms: 4-8 per site ---
  const rooms: Room[] = [];
  for (const site of sites) {
    const count = rng.int(4, 8);
    for (let i = 0; i < count; i++) {
      rooms.push({
        id: `room-${site.id}-${i + 1}`,
        siteId: site.id,
        name: `${ROOM_NAMES[i % ROOM_NAMES.length]}`,
        capacity: rng.weighted([[4, 4], [6, 4], [8, 3], [12, 2], [20, 1], [60, 0.5]]),
      });
    }
  }

  // --- Licenses ---
  const licenses: License[] = [
    { id: 'lic-1', sku: 'MTR-PRO', displayName: 'Teams Rooms Pro', vendor: 'teams', total: 60, assigned: 0, renewsAt: isoDay(anchorMs, 208), monthlyCostUsd: 40 },
    { id: 'lic-2', sku: 'E5-PHONE', displayName: 'Teams Phone with Calling Plan', vendor: 'teams', total: 150, assigned: 0, renewsAt: isoDay(anchorMs, 208), monthlyCostUsd: 15 },
    { id: 'lic-3', sku: 'WBX-DEV', displayName: 'Webex Device License', vendor: 'webex', total: 50, assigned: 0, renewsAt: isoDay(anchorMs, 96), monthlyCostUsd: 25 },
    { id: 'lic-4', sku: 'WBX-CALL', displayName: 'Webex Calling Professional', vendor: 'webex', total: 120, assigned: 0, renewsAt: isoDay(anchorMs, 96), monthlyCostUsd: 17 },
    { id: 'lic-5', sku: 'LENS-PLUS', displayName: 'Poly Lens Plus', vendor: 'poly', total: 70, assigned: 0, renewsAt: isoDay(anchorMs, 33), monthlyCostUsd: 8 },
  ];

  // --- Users: 48 ---
  const users: User[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < 48; i++) {
    let first = rng.pick(FIRST_NAMES);
    let last = rng.pick(LAST_NAMES);
    while (usedNames.has(`${first} ${last}`)) {
      first = rng.pick(FIRST_NAMES);
      last = rng.pick(LAST_NAMES);
    }
    usedNames.add(`${first} ${last}`);
    const licenseIds: string[] = [];
    if (rng.chance(0.75)) licenseIds.push(rng.chance(0.6) ? 'lic-2' : 'lic-4');
    users.push({
      id: `user-${i + 1}`,
      displayName: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@ucinventory.example`,
      title: rng.pick(TITLES),
      siteId: rng.pick(sites).id,
      licenseIds,
    });
  }

  // --- Projects: 8, mixed status, one overdue ---
  const projectDefs: { name: string; status: Project['status']; startOffset: number; targetOffset: number; progress: number }[] = [
    { name: 'Global MTR Refresh Wave 2', status: 'in-flight', startOffset: -120, targetOffset: 45, progress: 62 },
    { name: 'London HQ AV Modernisation', status: 'in-flight', startOffset: -60, targetOffset: 30, progress: 48 },
    { name: 'Frankfurt Webex Rollout', status: 'blocked', startOffset: -90, targetOffset: -14, progress: 71 }, // overdue + blocked
    { name: 'APAC Number Consolidation', status: 'in-flight', startOffset: -45, targetOffset: 75, progress: 35 },
    { name: 'Toronto Greenfield Fit-out', status: 'planning', startOffset: 14, targetOffset: 120, progress: 5 },
    { name: 'Legacy PBX Decommission', status: 'planning', startOffset: 30, targetOffset: 180, progress: 0 },
    { name: 'NY Trading Floor Upgrade', status: 'complete', startOffset: -210, targetOffset: -30, progress: 100 },
    { name: 'Sydney Huddle Room Pilot', status: 'complete', startOffset: -150, targetOffset: -60, progress: 100 },
  ];
  const projects: Project[] = projectDefs.map((def, i) => ({
    id: `proj-${i + 1}`,
    name: def.name,
    client: CLIENTS[i],
    status: def.status,
    startDate: isoDay(anchorMs, def.startOffset),
    targetDate: isoDay(anchorMs, def.targetOffset),
    owner: rng.pick(PROJECT_OWNERS),
    description: `${def.name} for ${CLIENTS[i]}: standardise room systems, calling and monitoring across the estate.`,
    siteIds: [rng.pick(sites).id, rng.pick(sites).id].filter((v, idx, arr) => arr.indexOf(v) === idx),
    progress: def.progress,
  }));
  const activeProjects = projects.filter((p) => p.status !== 'planning');

  // --- Devices: 150 ---
  const devices: Device[] = [];
  const deviceHealth = new Map<string, DeviceHealth>();
  const roomsBySite = new Map<string, Room[]>();
  for (const room of rooms) {
    const list = roomsBySite.get(room.siteId) ?? [];
    list.push(room);
    roomsBySite.set(room.siteId, list);
  }
  for (let i = 0; i < 150; i++) {
    const def = rng.pick(MODEL_DEFS);
    const site = rng.pick(sites);
    const siteRooms = roomsBySite.get(site.id) ?? [];
    const room = def.model.includes('Phone') ? undefined : rng.pick(siteRooms);
    const status: DeviceStatus = rng.weighted([
      ['online', 0.82],
      ['degraded', 0.08],
      ['offline', 0.10],
    ] as const);
    const lastSeenMinutes =
      status === 'online' ? rng.int(0, 15)
      : status === 'degraded' ? rng.int(5, 120)
      : rng.int(600, 20_000);
    const project = rng.chance(0.7) ? rng.pick(activeProjects) : undefined;
    const id = `${def.vendor}:dev-${i + 1}`;
    devices.push({
      id,
      vendor: def.vendor,
      name: room ? `${room.name} — ${def.model}` : `${def.model} #${i + 1}`,
      model: def.model,
      serialNumber: `${def.serialPrefix}${rng.digits(2)}${rng.hex(6)}`,
      macAddress: rng.mac(),
      ipAddress: `10.${sites.indexOf(site) + 10}.${rng.int(1, 8)}.${rng.int(10, 250)}`,
      firmwareVersion: rng.pick(def.firmware),
      status,
      lastSeenAt: new Date(anchorMs - lastSeenMinutes * 60_000).toISOString(),
      siteId: site.id,
      roomId: room?.id,
      projectId: project?.id,
      tags: deviceTags(def.model),
    });
    const issues: string[] = [];
    if (status === 'degraded') {
      issues.push(rng.pick([
        'Camera peripheral disconnected',
        'High packet loss on media path',
        'Firmware update pending for 14+ days',
        'Touch controller unreachable',
      ] as const));
    }
    if (status === 'offline') issues.push('No heartbeat received');
    deviceHealth.set(id, {
      deviceId: id,
      score: status === 'online' ? rng.int(88, 100) : status === 'degraded' ? rng.int(45, 75) : rng.int(0, 20),
      issues,
      cpuPct: status === 'offline' ? 0 : rng.int(4, 62),
      memoryPct: status === 'offline' ? 0 : rng.int(22, 78),
      temperatureC: status === 'offline' ? 0 : rng.int(34, 58),
      uptimeHours: status === 'offline' ? 0 : rng.int(1, 2100),
    });
  }

  // Recompute license assignment from actual usage.
  const teamsRooms = devices.filter((d) => d.vendor === 'teams' && !d.model.includes('Phone')).length;
  licenses[0].assigned = Math.min(licenses[0].total, teamsRooms);
  licenses[2].assigned = Math.min(licenses[2].total, devices.filter((d) => d.vendor === 'webex').length);
  licenses[4].assigned = Math.min(licenses[4].total, devices.filter((d) => d.vendor === 'poly').length);
  licenses[1].assigned = users.filter((u) => u.licenseIds.includes('lic-2')).length;
  licenses[3].assigned = users.filter((u) => u.licenseIds.includes('lic-4')).length;

  // --- Number ranges + 400 numbers ---
  const numberRanges: NumberRange[] = [];
  const numbers: PhoneNumber[] = [];
  const deskPhones = devices.filter((d) => d.tags.includes('desk-phone'));
  let numberIndex = 0;
  const perCountry = Math.ceil(400 / NUMBERING.length);
  for (let c = 0; c < NUMBERING.length; c++) {
    const plan = NUMBERING[c];
    const blockStart = rng.digits(plan.subscriberDigits - 2).padStart(plan.subscriberDigits - 2, '3');
    const rangeId = `range-${c + 1}`;
    const first = `${plan.prefix}${blockStart}00`;
    const last = `${plan.prefix}${blockStart}99`;
    numberRanges.push({
      id: rangeId,
      label: `${plan.country} DID block ${plan.prefix}${blockStart}xx`,
      carrier: plan.carrier,
      country: plan.country,
      first,
      last,
      size: perCountry,
    });
    // The Singapore block is mid-port on purpose (edge case).
    const portingRange = plan.country === 'SG';
    for (let n = 0; n < perCountry && numberIndex < 400; n++, numberIndex++) {
      const e164 = `${plan.prefix}${blockStart}${String(n).padStart(2, '0')}`;
      const status = portingRange
        ? ('porting' as const)
        : rng.weighted([
            ['assigned', 0.62],
            ['unassigned', 0.24],
            ['reserved', 0.14],
          ] as const);
      const assignToDevice = status === 'assigned' && rng.chance(0.25) && deskPhones.length > 0;
      const user = status === 'assigned' && !assignToDevice ? rng.pick(users) : undefined;
      const device = assignToDevice ? rng.pick(deskPhones) : undefined;
      numbers.push({
        id: `num-${numberIndex + 1}`,
        e164,
        country: plan.country,
        status,
        carrier: plan.carrier,
        rangeId,
        assignedUserId: user?.id,
        assignedDeviceId: device?.id,
        projectId: status === 'porting' ? 'proj-4' : rng.chance(0.5) ? rng.pick(activeProjects).id : undefined,
        portingTargetDate: portingRange ? isoDay(anchorMs, rng.int(7, 21)) : undefined,
      });
    }
  }

  // --- 90 days of time-series ---
  const callQuality: CallQualityPoint[] = [];
  const uptime: UptimePoint[] = [];
  const tickets: TicketPoint[] = [];
  const vendors: Vendor[] = ['teams', 'webex', 'poly'];
  const vendorDeviceCounts = new Map<Vendor, number>(
    vendors.map((v) => [v, devices.filter((d) => d.vendor === v).length]),
  );
  let backlog = 14;
  for (let day = -89; day <= 0; day++) {
    const date = isoDay(anchorMs, day);
    const weekday = new Date(anchorMs + day * DAY_MS).getUTCDay();
    const isWeekend = weekday === 0 || weekday === 6;
    // A network incident window 3 weeks ago drags quality down for 4 days.
    const incident = day >= -22 && day <= -19;
    for (const vendor of vendors) {
      const base = vendor === 'teams' ? 4.28 : vendor === 'webex' ? 4.22 : 4.12;
      const drift = Math.sin((day + 89) / 11) * 0.05;
      const mos = base + drift - (incident ? rng.float(0.35, 0.6) : 0) + rng.float(-0.04, 0.04);
      const packetLoss = (incident ? rng.float(1.2, 2.6) : rng.float(0.02, 0.35)) * (isWeekend ? 0.6 : 1);
      const count = vendorDeviceCounts.get(vendor) ?? 0;
      callQuality.push({
        date,
        vendor,
        mosAvg: round(mos, 2),
        jitterMsP95: round((incident ? rng.float(28, 55) : rng.float(4, 16)), 1),
        packetLossPct: round(packetLoss, 2),
        callCount: Math.round((isWeekend ? 40 : 240) * (count / 50) * rng.float(0.85, 1.15)),
        poorCallPct: round(incident ? rng.float(6, 14) : rng.float(0.2, 2.4), 1),
      });
      const offline = Math.round(count * (incident ? rng.float(0.06, 0.12) : rng.float(0.01, 0.05)));
      const degraded = Math.round(count * (incident ? rng.float(0.05, 0.1) : rng.float(0.01, 0.04)));
      uptime.push({
        date,
        vendor,
        uptimePct: round(100 * (1 - (offline + degraded * 0.4) / Math.max(1, count)), 2),
        onlineCount: count - offline - degraded,
        offlineCount: offline,
        degradedCount: degraded,
      });
    }
    const opened = Math.round((isWeekend ? 2 : 9) * (incident ? 2.4 : 1) * rng.float(0.7, 1.3));
    const resolved = Math.round((isWeekend ? 1 : 8) * rng.float(0.7, 1.3));
    backlog = Math.max(0, backlog + opened - resolved);
    tickets.push({ date, opened, resolved, backlog });
  }

  // --- Activity log: 60 events over the last 14 days ---
  const activity: ActivityEvent[] = [];
  const activityTemplates: readonly [ActivityType, (r: Rng) => { message: string; entityType: ActivityEvent['entityType']; entityId: string }][] = [
    ['device.offline', (r) => { const d = r.pick(devices); return { message: `${d.name} went offline`, entityType: 'device', entityId: d.id }; }],
    ['device.online', (r) => { const d = r.pick(devices); return { message: `${d.name} came back online`, entityType: 'device', entityId: d.id }; }],
    ['device.firmware', (r) => { const d = r.pick(devices); return { message: `${d.model} updated to ${d.firmwareVersion}`, entityType: 'device', entityId: d.id }; }],
    ['number.assigned', (r) => { const n = r.pick(numbers); const u = r.pick(users); return { message: `${n.e164} assigned to ${u.displayName}`, entityType: 'number', entityId: n.id }; }],
    ['number.ported', (r) => { const n = r.pick(numbers.filter((x) => x.status === 'porting')); return { message: `Port scheduled for ${n.e164}`, entityType: 'number', entityId: n.id }; }],
    ['project.status', (r) => { const p = r.pick(projects); return { message: `${p.name} moved to ${p.status}`, entityType: 'project', entityId: p.id }; }],
    ['connector.sync', (r) => { const v = r.pick(vendors); return { message: `${v} connector completed a full sync`, entityType: 'connector', entityId: v }; }],
    ['user.added', (r) => { const u = r.pick(users); return { message: `${u.displayName} added to the directory`, entityType: 'user', entityId: u.id }; }],
  ];
  for (let i = 0; i < 60; i++) {
    const [type, build] = rng.pick(activityTemplates);
    const built = build(rng);
    activity.push({
      id: `act-${i + 1}`,
      at: new Date(anchorMs - rng.int(2, 14 * 24 * 60) * 60_000).toISOString(),
      type,
      actor: rng.chance(0.4) ? 'system' : rng.pick(users).displayName,
      ...built,
    });
  }
  activity.push({
    id: 'act-webex-error',
    at: new Date(anchorMs - 42 * 60_000).toISOString(),
    type: 'connector.error',
    actor: 'system',
    message: 'Webex connector sync failed: 401 Unauthorized (token expired)',
    entityType: 'connector',
    entityId: 'webex',
  });
  activity.sort((a, b) => b.at.localeCompare(a.at));

  // --- Notifications ---
  const offlineCount = devices.filter((d) => d.status === 'offline').length;
  const notifications: AppNotification[] = [
    { id: 'ntf-1', at: new Date(anchorMs - 42 * 60_000).toISOString(), severity: 'critical', title: 'Webex connector authentication failed', body: 'The Webex access token was rejected (401). Live sync is paused until credentials are updated.', read: false },
    { id: 'ntf-2', at: new Date(anchorMs - 3 * 3600_000).toISOString(), severity: 'warning', title: `${offlineCount} devices offline`, body: `${offlineCount} devices have missed heartbeats for more than 10 hours. Most are in Frankfurt Campus.`, read: false },
    { id: 'ntf-3', at: new Date(anchorMs - 26 * 3600_000).toISOString(), severity: 'warning', title: 'Frankfurt Webex Rollout is overdue', body: 'Target date passed 14 days ago while the project is blocked on cabling works.', read: false },
    { id: 'ntf-4', at: new Date(anchorMs - 2 * DAY_MS).toISOString(), severity: 'info', title: 'SG number block port in progress', body: '67 Singapore DIDs are mid-port from the incumbent carrier; cutover expected within 3 weeks.', read: true },
    { id: 'ntf-5', at: new Date(anchorMs - 3 * DAY_MS).toISOString(), severity: 'info', title: 'Poly Lens Plus renewal in 33 days', body: 'The Poly Lens Plus subscription renews soon. Review seat count before auto-renewal.', read: true },
  ];

  // --- Saved views ---
  const savedViews: SavedView[] = [
    { id: 'view-1', name: 'Offline room systems', screen: 'devices', description: 'Room devices currently offline, grouped for triage.', filters: { status: 'offline', tag: 'room-system' } },
    { id: 'view-2', name: 'SG numbers mid-port', screen: 'numbers', description: 'Singapore DID block currently porting.', filters: { status: 'porting', country: 'SG' } },
    { id: 'view-3', name: 'At-risk projects', screen: 'projects', description: 'Blocked or overdue projects needing escalation.', filters: { status: 'blocked' } },
  ];

  // --- Connector states (webex intentionally errored in mock) ---
  const connectors: ConnectorState[] = [
    {
      id: 'teams', displayName: 'Microsoft Teams', source: 'mock', status: 'connected',
      lastSyncAt: new Date(anchorMs - 9 * 60_000).toISOString(), lastError: null, latencyMs: 184,
      credentials: [
        { name: 'MS_TENANT_ID', configured: false },
        { name: 'MS_CLIENT_ID', configured: false },
        { name: 'MS_CLIENT_SECRET', configured: false },
      ],
    },
    {
      id: 'webex', displayName: 'Cisco Webex', source: 'mock', status: 'error',
      lastSyncAt: new Date(anchorMs - 26 * 3600_000).toISOString(),
      lastError: '401 Unauthorized: access token expired', latencyMs: null,
      credentials: [{ name: 'WEBEX_ACCESS_TOKEN', configured: false }],
    },
    {
      id: 'poly', displayName: 'Poly Lens', source: 'mock', status: 'connected',
      lastSyncAt: new Date(anchorMs - 21 * 60_000).toISOString(), lastError: null, latencyMs: 226,
      credentials: [
        { name: 'POLY_LENS_CLIENT_ID', configured: false },
        { name: 'POLY_LENS_API_SECRET', configured: false },
      ],
    },
  ];

  return {
    sites, rooms, users, licenses, projects, devices, deviceHealth,
    numberRanges, numbers, callQuality, uptime, tickets, activity,
    notifications, savedViews, connectors,
  };
}
