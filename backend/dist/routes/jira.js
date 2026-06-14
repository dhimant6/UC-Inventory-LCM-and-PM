"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const JiraService_1 = require("../services/JiraService");
const router = express_1.default.Router();
const jiraConfigSchema = zod_1.z.object({
    baseUrl: zod_1.z.string().url(),
    apiKey: zod_1.z.string().min(10),
});
const jiraIssueSchema = zod_1.z.object({
    projectId: zod_1.z.string().min(2),
    summary: zod_1.z.string().min(5),
    description: zod_1.z.string().optional(),
    type: zod_1.z.enum(['Bug', 'Task', 'Story']).default('Task'),
    priority: zod_1.z.enum(['Highest', 'High', 'Medium', 'Low', 'Lowest']).default('Medium'),
    assignee: zod_1.z.string().optional(),
    assigneeName: zod_1.z.string().optional(),
    labels: zod_1.z.array(zod_1.z.string()).default([]),
});
router.post('/config', async (req, res) => {
    try {
        const config = jiraConfigSchema.parse(req.body);
        const jiraService = new JiraService_1.JiraService(config.baseUrl, config.apiKey);
        res.json({ message: 'Jira configuration saved', service: jiraService });
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid input', details: error });
    }
});
router.post('/project', async (req, res) => {
    try {
        const { projectId, ...issueData } = jiraIssueSchema.parse(req.body);
        const jiraService = new JiraService_1.JiraService(process.env.JIRA_BASE_URL || '', process.env.JIRA_API_KEY || '');
        const result = await jiraService.createIssue(projectId, issueData);
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to create Jira issue', details: error });
    }
});
router.post('/sync-expiry/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        const jiraService = new JiraService_1.JiraService(process.env.JIRA_BASE_URL || '', process.env.JIRA_API_KEY || '');
        const result = await jiraService.syncDeviceExpiry(deviceId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to sync device expiry', details: error });
    }
});
router.put('/project/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const updates = req.body;
        const jiraService = new JiraService_1.JiraService(process.env.JIRA_BASE_URL || '', process.env.JIRA_API_KEY || '');
        const result = await jiraService.updateProject(projectId, updates);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to update Jira project', details: error });
    }
});
exports.default = router;
//# sourceMappingURL=jira.js.map