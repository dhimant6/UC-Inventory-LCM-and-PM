import express, { Request, Response } from 'express';
import { TeamModel } from '../models/Team';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const team = TeamModel.create({
      id: Math.random().toString(36).substring(7),
      ...req.body,
    });

    res.status(201).json(team);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error });
  }
});

router.get('/', (req: Request, res: Response) => {
  try {
    const teams = TeamModel.findAll();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const team = TeamModel.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

export default router;
