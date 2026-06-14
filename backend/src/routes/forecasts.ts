import express, { Request, Response } from 'express';
import { z } from 'zod';
import { ForecastModel } from '../models/Forecast';
import { TeamModel } from '../models/Team';

const router = express.Router();

const forecastSchema = z.object({
  teamId: z.string().min(2),
  period: z.enum(['monthly', 'quarterly', 'yearly']),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  expectedHours: z.number().min(0),
  actualHours: z.number().min(0).optional(),
  variance: z.number().optional(),
  notes: z.string().optional(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const forecastData = forecastSchema.parse(req.body);

    const team = TeamModel.findById(forecastData.teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const forecast = ForecastModel.create({
      id: Math.random().toString(36).substring(7),
      ...forecastData,
    });

    res.status(201).json(forecast);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error });
  }
});

router.get('/', (req: Request, res: Response) => {
  try {
    const forecasts = ForecastModel.findAll();
    res.json(forecasts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch forecasts' });
  }
});

router.get('/team/:teamId', (req: Request, res: Response) => {
  try {
    const forecasts = ForecastModel.findByTeam(req.params.teamId);
    res.json(forecasts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch forecasts for team' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const forecast = ForecastModel.findById(req.params.id);
    if (!forecast) {
      return res.status(404).json({ error: 'Forecast not found' });
    }

    const updates = forecastSchema.partial().parse(req.body);
    ForecastModel.update(req.params.id, updates);

    const updatedForecast = ForecastModel.findById(req.params.id);
    res.json(updatedForecast);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error });
  }
});

export default router;
