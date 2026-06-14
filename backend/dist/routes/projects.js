"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const Project_1 = require("../models/Project");
const Device_1 = require("../models/Device");
const Team_1 = require("../models/Team");
const router = express_1.default.Router();
const projectSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    description: zod_1.z.string().min(10),
    status: zod_1.z.enum(['active', 'completed', 'on_hold', 'cancelled']).default('active'),
    deviceId: zod_1.z.string().min(2),
    jiraId: zod_1.z.string().optional(),
    startDate: zod_1.z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
    endDate: zod_1.z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }).optional(),
    assignedTeam: zod_1.z.string().optional(),
});
router.post('/', async (req, res) => {
    try {
        const projectData = projectSchema.parse(req.body);
        const device = Device_1.DeviceModel.findById(projectData.deviceId);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        if (projectData.assignedTeam) {
            const team = Team_1.TeamModel.findById(projectData.assignedTeam);
            if (!team) {
                return res.status(404).json({ error: 'Team not found' });
            }
        }
        const project = Project_1.ProjectModel.create({
            id: Math.random().toString(36).substring(7),
            ...projectData,
        });
        res.status(201).json(project);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid input', details: error });
    }
});
router.get('/', (req, res) => {
    try {
        const projects = Project_1.ProjectModel.findAll();
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});
router.get('/:id', (req, res) => {
    try {
        const project = Project_1.ProjectModel.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const project = Project_1.ProjectModel.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const updates = projectSchema.partial().parse(req.body);
        Project_1.ProjectModel.update(req.params.id, updates);
        const updatedProject = Project_1.ProjectModel.findById(req.params.id);
        res.json(updatedProject);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid input', details: error });
    }
});
router.delete('/:id', (req, res) => {
    try {
        const project = Project_1.ProjectModel.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        Project_1.ProjectModel.delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});
router.get('/device/:deviceId', (req, res) => {
    try {
        const projects = Project_1.ProjectModel.getByDevice(req.params.deviceId);
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects for device' });
    }
});
exports.default = router;
//# sourceMappingURL=projects.js.map