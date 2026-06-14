"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const PhoneManagementService_1 = require("../services/PhoneManagementService");
const router = express_1.default.Router();
const phoneSchema = zod_1.z.object({
    number: zod_1.z.string().min(10),
    type: zod_1.z.enum(['mobile', 'landline', 'voip']),
    teamId: zod_1.z.string().min(2),
    assignedTo: zod_1.z.string().optional(),
    status: zod_1.z.enum(['active', 'inactive', 'reserved']).default('active'),
    purchaseDate: zod_1.z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
    expiryDate: zod_1.z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }).optional(),
    notes: zod_1.z.string().optional(),
});
router.post('/', async (req, res) => {
    try {
        const phoneData = phoneSchema.parse(req.body);
        const phoneService = new PhoneManagementService_1.PhoneManagementService();
        const result = await phoneService.addPhoneNumber(phoneData);
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid input', details: error });
    }
});
router.get('/', async (req, res) => {
    try {
        const phoneService = new PhoneManagementService_1.PhoneManagementService();
        const phones = await phoneService.getAllPhoneNumbers();
        res.json(phones);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch phone numbers' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const phoneService = new PhoneManagementService_1.PhoneManagementService();
        const phone = await phoneService.getPhoneById(id);
        if (!phone) {
            return res.status(404).json({ error: 'Phone not found' });
        }
        res.json(phone);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch phone' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = phoneSchema.partial().parse(req.body);
        const phoneService = new PhoneManagementService_1.PhoneManagementService();
        const result = await phoneService.updatePhoneNumber(id, updates);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid input', details: error });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const phoneService = new PhoneManagementService_1.PhoneManagementService();
        await phoneService.deletePhoneNumber(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete phone' });
    }
});
router.post('/bulk', async (req, res) => {
    try {
        const phoneDataList = req.body;
        const phoneService = new PhoneManagementService_1.PhoneManagementService();
        const result = await phoneService.bulkImportPhoneNumbers(phoneDataList);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to bulk import phones', details: error });
    }
});
router.post('/assign', async (req, res) => {
    try {
        const { phoneId, userId } = req.body;
        const phoneService = new PhoneManagementService_1.PhoneManagementService();
        const result = await phoneService.assignPhoneToUser(phoneId, userId);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to assign phone', details: error });
    }
});
router.post('/unassign/:phoneId', async (req, res) => {
    try {
        const { phoneId } = req.params;
        const phoneService = new PhoneManagementService_1.PhoneManagementService();
        await phoneService.unassignPhone(phoneId);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to unassign phone', details: error });
    }
});
exports.default = router;
//# sourceMappingURL=phone.js.map