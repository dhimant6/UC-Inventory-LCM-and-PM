import { Router } from 'express';
import { getStore } from '../store';

/** Read endpoints over the synced inventory cache. */
export const inventoryRouter = Router();

inventoryRouter.get('/projects', (_req, res) => {
  const { projects, devices, numbers } = getStore();
  res.json(
    projects.map((p) => ({
      ...p,
      deviceCount: devices.filter((d) => d.projectId === p.id).length,
      numberCount: numbers.filter((n) => n.projectId === p.id).length,
    })),
  );
});

inventoryRouter.get('/projects/:id', (req, res) => {
  const store = getStore();
  const project = store.projects.find((p) => p.id === req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json({
    ...project,
    devices: store.devices.filter((d) => d.projectId === project.id),
    numbers: store.numbers.filter((n) => n.projectId === project.id),
    sites: store.sites.filter((s) => project.siteIds.includes(s.id)),
  });
});

inventoryRouter.get('/devices', (_req, res) => {
  res.json(getStore().devices);
});

inventoryRouter.get('/devices/:id', (req, res) => {
  const store = getStore();
  const device = store.devices.find((d) => d.id === req.params.id);
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }
  res.json({
    ...device,
    health: store.deviceHealth.get(device.id) ?? null,
    site: store.sites.find((s) => s.id === device.siteId) ?? null,
    room: store.rooms.find((r) => r.id === device.roomId) ?? null,
    project: store.projects.find((p) => p.id === device.projectId) ?? null,
    numbers: store.numbers.filter((n) => n.assignedDeviceId === device.id),
  });
});

inventoryRouter.get('/numbers', (_req, res) => {
  res.json(getStore().numbers);
});

inventoryRouter.get('/number-ranges', (_req, res) => {
  const { numberRanges, numbers } = getStore();
  res.json(
    numberRanges.map((r) => ({
      ...r,
      assigned: numbers.filter((n) => n.rangeId === r.id && n.status === 'assigned').length,
      porting: numbers.filter((n) => n.rangeId === r.id && n.status === 'porting').length,
    })),
  );
});

inventoryRouter.get('/users', (_req, res) => {
  const { users, numbers } = getStore();
  res.json(
    users.map((u) => ({
      ...u,
      numberCount: numbers.filter((n) => n.assignedUserId === u.id).length,
    })),
  );
});

inventoryRouter.get('/sites', (_req, res) => {
  const { sites, rooms, devices, users } = getStore();
  res.json(
    sites.map((s) => ({
      ...s,
      roomCount: rooms.filter((r) => r.siteId === s.id).length,
      deviceCount: devices.filter((d) => d.siteId === s.id).length,
      userCount: users.filter((u) => u.siteId === s.id).length,
      offlineCount: devices.filter((d) => d.siteId === s.id && d.status === 'offline').length,
    })),
  );
});

inventoryRouter.get('/rooms', (_req, res) => {
  const { rooms, devices } = getStore();
  res.json(
    rooms.map((r) => ({
      ...r,
      devices: devices.filter((d) => d.roomId === r.id),
    })),
  );
});

inventoryRouter.get('/licenses', (_req, res) => {
  res.json(getStore().licenses);
});

inventoryRouter.get('/saved-views', (_req, res) => {
  res.json(getStore().savedViews);
});
