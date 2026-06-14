import express, { Request, Response } from 'express';
import { z } from 'zod';
import { TimeEntryModel } from '../models/TimeEntry';
import { UserModel } from '../models/User';
import { ProjectModel } from '../models/Project';

const router = express.Router();

const timeEntrySchema = z.object({
  userId: z.string().min(2),
  date: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  hours: z.number().min(0).max(24),
  projectId: z.string().min(2).optional(),
  description: z.string().min(10),
  teamId: z.string().min(2).optional(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const entryData = timeEntrySchema.parse(req.body);

    const user = UserModel.findById(entryData.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (entryData.projectId) {
      const project = ProjectModel.findById(entryData.projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
    }

    if (entryData.teamId) {
      const team = TeamModel.findById(entryData.teamId);
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }
    }

    const entry = TimeEntryModel.create({
      id: Math.random().toString(36).substring(7),
      ...entryData,
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error });
  }
});

router.get('/', (req: Request, res: Response) => {
  try {
    const entries = TimeEntryModel.findAll();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

router.get('/user/:userId', (req: Request, res: Response) => {
  try {
    const entries = TimeEntryModel.findByUser(req.params.userId);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch time entries for user' });
  }
});

router.get('/date-range', (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const entries = TimeEntryModel.getByDateRange(startDate as string, endDate as string);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch time entries by date range' });
  }
});

export default router;
