import { Router } from 'express';
import { getStore } from '../store';

/** Dashboard summary, time-series, activity, notifications, global search. */
export const insightsRouter = Router();

insightsRouter.get('/summary', (_req, res) => {
  const store = getStore();
  const { devices, numbers, projects } = store;
  const today = store.callQuality.filter((p) => p.date === store.callQuality[store.callQuality.length - 1]?.date);
  const mosToday = today.length
    ? today.reduce((sum, p) => sum + p.mosAvg * p.callCount, 0) /
      Math.max(1, today.reduce((sum, p) => sum + p.callCount, 0))
    : 0;
  res.json({
    devices: {
      total: devices.length,
      online: devices.filter((d) => d.status === 'online').length,
      degraded: devices.filter((d) => d.status === 'degraded').length,
      offline: devices.filter((d) => d.status === 'offline').length,
    },
    numbers: {
      total: numbers.length,
      assigned: numbers.filter((n) => n.status === 'assigned').length,
      unassigned: numbers.filter((n) => n.status === 'unassigned').length,
      reserved: numbers.filter((n) => n.status === 'reserved').length,
      porting: numbers.filter((n) => n.status === 'porting').length,
    },
    projects: {
      total: projects.length,
      planning: projects.filter((p) => p.status === 'planning').length,
      inFlight: projects.filter((p) => p.status === 'in-flight').length,
      blocked: projects.filter((p) => p.status === 'blocked').length,
      complete: projects.filter((p) => p.status === 'complete').length,
      overdue: projects.filter(
        (p) => p.status !== 'complete' && p.targetDate < new Date().toISOString().slice(0, 10),
      ).length,
    },
    sites: store.sites.length,
    users: store.users.length,
    mosToday: Math.round(mosToday * 100) / 100,
    ticketBacklog: store.tickets[store.tickets.length - 1]?.backlog ?? 0,
    unreadNotifications: store.notifications.filter((n) => !n.read).length,
  });
});

function clampDays(raw: unknown): number {
  const days = Number(raw);
  if (Number.isNaN(days)) return 90;
  return Math.min(90, Math.max(7, Math.floor(days)));
}

insightsRouter.get('/timeseries/call-quality', (req, res) => {
  const days = clampDays(req.query.days);
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  res.json(getStore().callQuality.filter((p) => p.date >= cutoff));
});

insightsRouter.get('/timeseries/uptime', (req, res) => {
  const days = clampDays(req.query.days);
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  res.json(getStore().uptime.filter((p) => p.date >= cutoff));
});

insightsRouter.get('/timeseries/tickets', (req, res) => {
  const days = clampDays(req.query.days);
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  res.json(getStore().tickets.filter((p) => p.date >= cutoff));
});

insightsRouter.get('/activity', (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 60));
  res.json(getStore().activity.slice(0, limit));
});

insightsRouter.get('/notifications', (_req, res) => {
  res.json(getStore().notifications);
});

insightsRouter.post('/notifications/:id/read', (req, res) => {
  const notification = getStore().notifications.find((n) => n.id === req.params.id);
  if (!notification) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  notification.read = true;
  res.json(notification);
});

insightsRouter.post('/notifications/read-all', (_req, res) => {
  for (const n of getStore().notifications) n.read = true;
  res.json({ ok: true });
});

insightsRouter.get('/search', (req, res) => {
  const q = String(req.query.q ?? '').trim().toLowerCase();
  if (q.length < 2) {
    res.json({ devices: [], numbers: [], projects: [], users: [], sites: [] });
    return;
  }
  const store = getStore();
  const match = (...fields: (string | undefined)[]): boolean =>
    fields.some((f) => f?.toLowerCase().includes(q));
  res.json({
    devices: store.devices
      .filter((d) => match(d.name, d.model, d.serialNumber, d.macAddress, d.ipAddress))
      .slice(0, 8),
    numbers: store.numbers.filter((n) => match(n.e164, n.carrier)).slice(0, 8),
    projects: store.projects.filter((p) => match(p.name, p.client, p.owner)).slice(0, 8),
    users: store.users.filter((u) => match(u.displayName, u.email, u.title)).slice(0, 8),
    sites: store.sites.filter((s) => match(s.name, s.city, s.country)).slice(0, 8),
  });
});
