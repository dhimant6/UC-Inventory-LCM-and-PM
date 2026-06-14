import express, { Request, Response } from 'express';
import { z } from 'zod';
import { PhoneManagementService } from '../services/PhoneManagementService';

const router = express.Router();

const phoneSchema = z.object({
  number: z.string().min(10),
  type: z.enum(['mobile', 'landline', 'voip']),
  teamId: z.string().min(2),
  assignedTo: z.string().optional(),
  status: z.enum(['active', 'inactive', 'reserved']).default('active'),
  purchaseDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  expiryDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }).optional(),
  notes: z.string().optional(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const phoneData = phoneSchema.parse(req.body);

    const phoneService = new PhoneManagementService();
    const result = await phoneService.addPhoneNumber(phoneData);

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const phoneService = new PhoneManagementService();
    const phones = await phoneService.getAllPhoneNumbers();
    res.json(phones);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch phone numbers' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const phoneService = new PhoneManagementService();
    const phone = await phoneService.getPhoneById(id);
    if (!phone) {
      return res.status(404).json({ error: 'Phone not found' });
    }
    res.json(phone);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch phone' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = phoneSchema.partial().parse(req.body);

    const phoneService = new PhoneManagementService();
    const result = await phoneService.updatePhoneNumber(id, updates);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const phoneService = new PhoneManagementService();
    await phoneService.deletePhoneNumber(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete phone' });
  }
});

router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const phoneDataList = req.body;
    const phoneService = new PhoneManagementService();
    const result = await phoneService.bulkImportPhoneNumbers(phoneDataList);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Failed to bulk import phones', details: error });
  }
});

router.post('/assign', async (req: Request, res: Response) => {
  try {
    const { phoneId, userId } = req.body;
    const phoneService = new PhoneManagementService();
    const result = await phoneService.assignPhoneToUser(phoneId, userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Failed to assign phone', details: error });
  }
});

router.post('/unassign/:phoneId', async (req: Request, res: Response) => {
  try {
    const { phoneId } = req.params;
    const phoneService = new PhoneManagementService();
    await phoneService.unassignPhone(phoneId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to unassign phone', details: error });
  }
});

export default router;
