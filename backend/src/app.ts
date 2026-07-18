import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './env';
import { connectorsRouter } from './routes/connectors';
import { insightsRouter } from './routes/insights';
import { inventoryRouter } from './routes/inventory';

export function createApp(): express.Express {
  const app = express();
  app.use(helmet());
  app.use(cors());
  if (process.env.NODE_ENV !== 'test') app.use(morgan('tiny'));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, dataSource: env.dataSource });
  });

  app.use('/api', inventoryRouter);
  app.use('/api', insightsRouter);
  app.use('/api/connectors', connectorsRouter);

  app.use((req, res) => {
    res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
  });

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: error.message });
  });

  return app;
}
