import express, { Request, Response } from 'express';
import { PhoneModel } from '../models/Phone';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const phone = PhoneModel.create({
      id: Math.random().toString(36).substring(7),
      ...req.body,
    });

    res.status(201).json(phone);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error });
  }
});

router.get('/', (req: Request, res: Response) => {
  try {
    const phones = PhoneModel.findAll();
    res.json(phones);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch phones' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const phone = PhoneModel.findById(req.params.id);
    if (!phone) {
      return res.status(404).json({ error: 'Phone not found' });
    }
    res.json(phone);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch phone' });
  }
});

export default router;
