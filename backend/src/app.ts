import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './env';
import { connectorsRouter } from './routes/connectors';
import { insightsRouter } from './routes/insights';
import { inventoryRouter } from './routes/inventory';

// Built SPA, relative to compiled backend/dist/app.js -> ../../frontend/dist.
const SPA_DIR = path.resolve(__dirname, '../../frontend/dist');
const hasSpa = fs.existsSync(path.join(SPA_DIR, 'index.html'));

export function createApp(): express.Express {
  const app = express();
  // CSP disabled: the app serves its own assets incl. an inline theme script.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  if (process.env.NODE_ENV !== 'test') app.use(morgan('tiny'));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, dataSource: env.dataSource });
  });

  app.use('/api', inventoryRouter);
  app.use('/api', insightsRouter);
  app.use('/api/connectors', connectorsRouter);

  // Unknown /api routes 404 as JSON.
  app.use('/api', (req, res) => {
    res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
  });

  // In production the backend also serves the built SPA on the same origin,
  // so the frontend's relative /api calls work with no proxy or CORS config.
  if (hasSpa) {
    app.use(express.static(SPA_DIR));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(SPA_DIR, 'index.html'));
    });
  }

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: error.message });
  });

  return app;
}
