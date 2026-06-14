import express, { Request, Response } from 'express';
import { z } from 'zod';
import { UserModel } from '../models/User';

const router = express.Router();

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['admin', 'user', 'manager']),
  teamId: z.string().optional(),
  avatar: z.string().optional(),
  password: z.string().min(8).optional(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userData = userSchema.parse(req.body);

    const existingUser = UserModel.findByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : undefined;

    const user = UserModel.create({
      id: Math.random().toString(36).substring(7),
      ...userData,
      password: hashedPassword,
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error });
  }
});

router.get('/', (req: Request, res: Response) => {
  try {
    const users = UserModel.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const user = UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const user = UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = userSchema.partial().parse(req.body);

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    UserModel.update(req.params.id, updates);

    const updatedUser = UserModel.findById(req.params.id);
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const user = UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    UserModel.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
