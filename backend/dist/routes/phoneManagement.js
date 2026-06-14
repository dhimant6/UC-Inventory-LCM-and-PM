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
router.post('/add', async (req, res) => {
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
router.delete('/remove/:phoneId', async (req, res) => {
    try {
        const { phoneId } = req.params;
        const phoneService = new PhoneManagementService_1.PhoneManagementService();
        await phoneService.removePhoneNumber(phoneId);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to remove phone', details: error });
    }
});
router.post('/reassign', async (req, res) => {
    try {
        const { phoneId, newAssigneeId } = req.body;
        const phoneService = new PhoneManagementService_1.PhoneManagementService();
        const result = await phoneService.reassignPhone(phoneId, newAssigneeId);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to reassign phone', details: error });
    }
});
router.get('/history/:phoneId', async (req, res) => {
    try {
        const { phoneId } = req.params;
        const phoneService = new PhoneManagementService_1.PhoneManagementService();
        const result = await phoneService.getPhoneAssignmentHistory(phoneId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get phone history', details: error });
    }
});
router.post('/bulk-import', async (req, res) => {
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
exports.default = router;
//# sourceMappingURL=phoneManagement.js.map