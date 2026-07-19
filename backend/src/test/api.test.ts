import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { generateSeedData } from '../seed/generate';
import { resetStore } from '../store';

const app = createApp();

beforeAll(() => {
  resetStore();
});

describe('seed determinism', () => {
  it('produces identical data for the same seed and anchor', () => {
    const anchor = Date.parse('2026-07-18T12:00:00Z');
    const a = generateSeedData(42, anchor);
    const b = generateSeedData(42, anchor);
    expect(a.devices).toEqual(b.devices);
    expect(a.numbers).toEqual(b.numbers);
    expect(a.callQuality).toEqual(b.callQuality);
  });

  it('meets the dataset contract', () => {
    const data = generateSeedData();
    expect(data.projects).toHaveLength(8);
    expect(data.devices).toHaveLength(150);
    expect(data.numbers).toHaveLength(400);
    expect(data.callQuality.length).toBe(90 * 3);
    expect(data.tickets).toHaveLength(90);
    expect(data.savedViews.length).toBeGreaterThanOrEqual(3);
    // Edge cases are seeded on purpose.
    expect(data.devices.some((d) => d.status === 'offline')).toBe(true);
    expect(data.numbers.some((n) => n.status === 'porting')).toBe(true);
    expect(data.connectors.some((c) => c.status === 'error')).toBe(true);
    const today = new Date().toISOString().slice(0, 10);
    expect(
      data.projects.some((p) => p.status !== 'complete' && p.targetDate < today),
    ).toBe(true);
    // Every number is E.164.
    for (const n of data.numbers) expect(n.e164).toMatch(/^\+\d{8,15}$/);
  });
});

describe('API smoke', () => {
  const listRoutes = [
    '/api/projects',
    '/api/devices',
    '/api/numbers',
    '/api/number-ranges',
    '/api/users',
    '/api/sites',
    '/api/rooms',
    '/api/licenses',
    '/api/saved-views',
    '/api/timeseries/call-quality',
    '/api/timeseries/uptime',
    '/api/timeseries/tickets',
    '/api/activity',
    '/api/notifications',
  ];

  for (const route of listRoutes) {
    it(`GET ${route} returns a non-empty list`, async () => {
      const res = await request(app).get(route);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  }

  it('GET /api/summary aggregates counts', async () => {
    const res = await request(app).get('/api/summary');
    expect(res.status).toBe(200);
    expect(res.body.devices.total).toBe(150);
    expect(res.body.numbers.total).toBe(400);
    expect(res.body.projects.overdue).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/devices/:id joins health, site and room', async () => {
    const list = await request(app).get('/api/devices');
    const id = list.body[0].id as string;
    const res = await request(app).get(`/api/devices/${encodeURIComponent(id)}`);
    expect(res.status).toBe(200);
    expect(res.body.health).toBeTruthy();
    expect(res.body.site).toBeTruthy();
  });

  it('GET /api/connectors reports the seeded webex error', async () => {
    const res = await request(app).get('/api/connectors');
    expect(res.status).toBe(200);
    expect(res.body.dataSource).toBe('mock');
    const webex = res.body.connectors.find((c: { id: string }) => c.id === 'webex');
    expect(webex.status).toBe('error');
    expect(webex.lastError).toContain('401');
  });

  it('POST /api/connectors/webex/test surfaces the failure without a 5xx', async () => {
    const res = await request(app).post('/api/connectors/webex/test');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain('401');
  });

  it('POST /api/connectors/teams/sync succeeds in mock mode', async () => {
    const res = await request(app).post('/api/connectors/teams/sync');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.deviceCount).toBeGreaterThan(0);
  });

  it('GET /api/search finds entities across types', async () => {
    const res = await request(app).get('/api/search?q=studio');
    expect(res.status).toBe(200);
    expect(res.body.devices.length).toBeGreaterThan(0);
  });

  it('unknown routes 404 with a JSON body', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeTruthy();
  });

  it('seeds MTR-tagged devices from Teams and Webex', async () => {
    const res = await request(app).get('/api/devices');
    const mtr = res.body.filter((d: { tags: string[] }) => d.tags.includes('mtr'));
    expect(mtr.length).toBeGreaterThan(0);
    const vendors = new Set(mtr.map((d: { vendor: string }) => d.vendor));
    expect(vendors.has('teams')).toBe(true);
    expect(vendors.has('webex')).toBe(true);
  });
});

describe('project CRUD + import', () => {
  it('creates, updates and deletes a project', async () => {
    const create = await request(app)
      .post('/api/projects')
      .send({ name: 'Test Rollout', client: 'Acme', status: 'planning' });
    expect(create.status).toBe(201);
    const id = create.body.id as string;

    const update = await request(app).put(`/api/projects/${id}`).send({ name: 'Test Rollout', status: 'in-flight', progress: 40 });
    expect(update.status).toBe(200);
    expect(update.body.status).toBe('in-flight');
    expect(update.body.progress).toBe(40);

    const del = await request(app).delete(`/api/projects/${id}`);
    expect(del.status).toBe(200);
    const after = await request(app).get(`/api/projects/${id}`);
    expect(after.status).toBe(404);
  });

  it('rejects a project without a name', async () => {
    const res = await request(app).post('/api/projects').send({ client: 'No Name' });
    expect(res.status).toBe(400);
  });

  it('imports projects in bulk', async () => {
    const res = await request(app)
      .post('/api/projects/import')
      .send([{ name: 'Imported A' }, { name: 'Imported B', status: 'blocked' }, { client: 'skip' }]);
    expect(res.status).toBe(200);
    expect(res.body.created).toBe(2);
    expect(res.body.errors.length).toBe(1);
  });
});

describe('number import', () => {
  it('imports valid E.164 numbers and skips bad rows', async () => {
    const res = await request(app)
      .post('/api/numbers/import')
      .send([
        { e164: '+14155550111', carrier: 'Teams' },
        { e164: 'not-a-number' },
      ]);
    expect(res.status).toBe(200);
    expect(res.body.created + res.body.updated).toBe(1);
    expect(res.body.errors.length).toBe(1);
  });
});
