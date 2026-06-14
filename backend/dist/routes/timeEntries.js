"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const TimeEntry_1 = require("../models/TimeEntry");
const User_1 = require("../models/User");
const Project_1 = require("../models/Project");
const router = express_1.default.Router();
const timeEntrySchema = zod_1.z.object({
    userId: zod_1.z.string().min(2),
    date: zod_1.z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
    hours: zod_1.z.number().min(0).max(24),
    projectId: zod_1.z.string().min(2).optional(),
    description: zod_1.z.string().min(10),
    teamId: zod_1.z.string().min(2).optional(),
});
router.post('/', async (req, res) => {
    try {
        const entryData = timeEntrySchema.parse(req.body);
        const user = User_1.UserModel.findById(entryData.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (entryData.projectId) {
            const project = Project_1.ProjectModel.findById(entryData.projectId);
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }
        }
        if (entryData.teamId) {
            const team = TeamModel.findById(entryData.teamId);
            if (!team) {
                return res.status(404).json({ error: 'Team not found' });
            }
        }
        const entry = TimeEntry_1.TimeEntryModel.create({
            id: Math.random().toString(36).substring(7),
            ...entryData,
        });
        res.status(201).json(entry);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid input', details: error });
    }
});
router.get('/', (req, res) => {
    try {
        const entries = TimeEntry_1.TimeEntryModel.findAll();
        res.json(entries);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch time entries' });
    }
});
router.get('/user/:userId', (req, res) => {
    try {
        const entries = TimeEntry_1.TimeEntryModel.findByUser(req.params.userId);
        res.json(entries);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch time entries for user' });
    }
});
router.get('/date-range', (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }
        const entries = TimeEntry_1.TimeEntryModel.getByDateRange(startDate, endDate);
        res.json(entries);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch time entries by date range' });
    }
});
exports.default = router;
//# sourceMappingURL=timeEntries.js.map