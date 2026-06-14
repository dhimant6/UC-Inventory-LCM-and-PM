import express, { Request, Response } from 'express';
import { z } from 'zod';
import { ServiceNowService } from '../services/ServiceNowService';

const router = express.Router();

const servicenowConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().min(10),
});

router.post('/config', async (req: Request, res: Response) => {
  try {
    const config = servicenowConfigSchema.parse(req.body);

    const servicenowService = new ServiceNowService(config.baseUrl, config.apiKey);

    res.json({ message: 'ServiceNow configuration saved', service: servicenowService });
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error });
  }
});

router.post('/sync-time-entries/:teamId', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;

    const servicenowService = new ServiceNowService(process.env.SERVICENOW_BASE_URL || '', process.env.SERVICENOW_API_KEY || '');
    const result = await servicenowService.syncTimeEntries(teamId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync time entries', details: error });
  }
});

router.post('/create-forecast', async (req: Request, res: Response) => {
  try {
    const forecastData = req.body;

    const servicenowService = new ServiceNowService(process.env.SERVICENOW_BASE_URL || '', process.env.SERVICENOW_API_KEY || '');
    const result = await servicenowService.createForecast(forecastData);

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create forecast', details: error });
  }
});

router.get('/calculate-capacity/:teamId', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;

    const servicenowService = new ServiceNowService(process.env.SERVICENOW_BASE_URL || '', process.env.SERVICENOW_API_KEY || '');
    const result = await servicenowService.calculateTeamCapacity(teamId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate capacity', details: error });
  }
});

export default router;
