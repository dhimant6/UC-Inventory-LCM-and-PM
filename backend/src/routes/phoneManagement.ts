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

router.post('/add', async (req: Request, res: Response) => {
  try {
    const phoneData = phoneSchema.parse(req.body);

    const phoneService = new PhoneManagementService();
    const result = await phoneService.addPhoneNumber(phoneData);

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error });
  }
});

router.delete('/remove/:phoneId', async (req: Request, res: Response) => {
  try {
    const { phoneId } = req.params;

    const phoneService = new PhoneManagementService();
    await phoneService.removePhoneNumber(phoneId);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove phone', details: error });
  }
});

router.post('/reassign', async (req: Request, res: Response) => {
  try {
    const { phoneId, newAssigneeId } = req.body;

    const phoneService = new PhoneManagementService();
    const result = await phoneService.reassignPhone(phoneId, newAssigneeId);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Failed to reassign phone', details: error });
  }
});

router.get('/history/:phoneId', async (req: Request, res: Response) => {
  try {
    const { phoneId } = req.params;

    const phoneService = new PhoneManagementService();
    const result = await phoneService.getPhoneAssignmentHistory(phoneId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get phone history', details: error });
  }
});

router.post('/bulk-import', async (req: Request, res: Response) => {
  try {
    const phoneDataList = req.body;

    const phoneService = new PhoneManagementService();
    const result = await phoneService.bulkImportPhoneNumbers(phoneDataList);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Failed to bulk import phones', details: error });
  }
});

export default router;
