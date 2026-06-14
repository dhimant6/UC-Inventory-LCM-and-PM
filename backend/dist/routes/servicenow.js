"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const ServiceNowService_1 = require("../services/ServiceNowService");
const router = express_1.default.Router();
const servicenowConfigSchema = zod_1.z.object({
    baseUrl: zod_1.z.string().url(),
    apiKey: zod_1.z.string().min(10),
});
router.post('/config', async (req, res) => {
    try {
        const config = servicenowConfigSchema.parse(req.body);
        const servicenowService = new ServiceNowService_1.ServiceNowService(config.baseUrl, config.apiKey);
        res.json({ message: 'ServiceNow configuration saved', service: servicenowService });
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid input', details: error });
    }
});
router.post('/sync-time-entries/:teamId', async (req, res) => {
    try {
        const { teamId } = req.params;
        const servicenowService = new ServiceNowService_1.ServiceNowService(process.env.SERVICENOW_BASE_URL || '', process.env.SERVICENOW_API_KEY || '');
        const result = await servicenowService.syncTimeEntries(teamId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to sync time entries', details: error });
    }
});
router.post('/create-forecast', async (req, res) => {
    try {
        const forecastData = req.body;
        const servicenowService = new ServiceNowService_1.ServiceNowService(process.env.SERVICENOW_BASE_URL || '', process.env.SERVICENOW_API_KEY || '');
        const result = await servicenowService.createForecast(forecastData);
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to create forecast', details: error });
    }
});
router.get('/calculate-capacity/:teamId', async (req, res) => {
    try {
        const { teamId } = req.params;
        const servicenowService = new ServiceNowService_1.ServiceNowService(process.env.SERVICENOW_BASE_URL || '', process.env.SERVICENOW_API_KEY || '');
        const result = await servicenowService.calculateTeamCapacity(teamId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to calculate capacity', details: error });
    }
});
exports.default = router;
//# sourceMappingURL=servicenow.js.map