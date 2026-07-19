import { Router } from 'express';
import type { Vendor } from '../domain/types';
import { env } from '../env';
import { allVendors, connectorStates, testConnection } from '../providers/registry';
import { syncVendor } from '../sync';

export const connectorsRouter = Router();

function parseVendor(raw: string): Vendor | null {
  return (allVendors() as string[]).includes(raw) ? (raw as Vendor) : null;
}

connectorsRouter.get('/', async (_req, res, next) => {
  try {
    res.json({ dataSource: env.dataSource, connectors: await connectorStates() });
  } catch (error) {
    next(error);
  }
});

connectorsRouter.post('/:vendor/test', async (req, res, next) => {
  const vendor = parseVendor(req.params.vendor);
  if (!vendor) {
    res.status(404).json({ error: 'Unknown connector' });
    return;
  }
  try {
    res.json(await testConnection(vendor));
  } catch (error) {
    next(error);
  }
});

connectorsRouter.post('/:vendor/sync', async (req, res, next) => {
  const vendor = parseVendor(req.params.vendor);
  if (!vendor) {
    res.status(404).json({ error: 'Unknown connector' });
    return;
  }
  try {
    res.json(await syncVendor(vendor));
  } catch (error) {
    next(error);
  }
});

connectorsRouter.post('/sync-all', async (_req, res, next) => {
  try {
    const results = await Promise.all(allVendors().map((v) => syncVendor(v)));
    res.json(results);
  } catch (error) {
    next(error);
  }
});
