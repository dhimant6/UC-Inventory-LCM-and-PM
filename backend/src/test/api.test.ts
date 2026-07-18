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
});
