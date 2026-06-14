import express, { Request, Response } from 'express';
import { DeviceModel } from '../models/Device';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const device = DeviceModel.create({
      id: Math.random().toString(36).substring(7),
      ...req.body,
    });

    res.status(201).json(device);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error });
  }
});

router.get('/', (req: Request, res: Response) => {
  try {
    const devices = DeviceModel.findAll();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const device = DeviceModel.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch device' });
  }
});

export default router;
