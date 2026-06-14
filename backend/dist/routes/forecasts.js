"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const Forecast_1 = require("../models/Forecast");
const Team_1 = require("../models/Team");
const router = express_1.default.Router();
const forecastSchema = zod_1.z.object({
    teamId: zod_1.z.string().min(2),
    period: zod_1.z.enum(['monthly', 'quarterly', 'yearly']),
    startDate: zod_1.z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
    endDate: zod_1.z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
    expectedHours: zod_1.z.number().min(0),
    actualHours: zod_1.z.number().min(0).optional(),
    variance: zod_1.z.number().optional(),
    notes: zod_1.z.string().optional(),
});
router.post('/', async (req, res) => {
    try {
        const forecastData = forecastSchema.parse(req.body);
        const team = Team_1.TeamModel.findById(forecastData.teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        const forecast = Forecast_1.ForecastModel.create({
            id: Math.random().toString(36).substring(7),
            ...forecastData,
        });
        res.status(201).json(forecast);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid input', details: error });
    }
});
router.get('/', (req, res) => {
    try {
        const forecasts = Forecast_1.ForecastModel.findAll();
        res.json(forecasts);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch forecasts' });
    }
});
router.get('/team/:teamId', (req, res) => {
    try {
        const forecasts = Forecast_1.ForecastModel.findByTeam(req.params.teamId);
        res.json(forecasts);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch forecasts for team' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const forecast = Forecast_1.ForecastModel.findById(req.params.id);
        if (!forecast) {
            return res.status(404).json({ error: 'Forecast not found' });
        }
        const updates = forecastSchema.partial().parse(req.body);
        Forecast_1.ForecastModel.update(req.params.id, updates);
        const updatedForecast = Forecast_1.ForecastModel.findById(req.params.id);
        res.json(updatedForecast);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid input', details: error });
    }
});
exports.default = router;
//# sourceMappingURL=forecasts.js.map