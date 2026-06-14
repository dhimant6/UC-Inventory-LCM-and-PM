import express, { Request, Response } from 'express';
import { z } from 'zod';
import { JiraService } from '../services/JiraService';

const router = express.Router();

const jiraConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().min(10),
});

const jiraIssueSchema = z.object({
  projectId: z.string().min(2),
  summary: z.string().min(5),
  description: z.string().optional(),
  type: z.enum(['Bug', 'Task', 'Story']).default('Task'),
  priority: z.enum(['Highest', 'High', 'Medium', 'Low', 'Lowest']).default('Medium'),
  assignee: z.string().optional(),
  assigneeName: z.string().optional(),
  labels: z.array(z.string()).default([]),
});

router.post('/config', async (req: Request, res: Response) => {
  try {
    const config = jiraConfigSchema.parse(req.body);

    const jiraService = new JiraService(config.baseUrl, config.apiKey);

    res.json({ message: 'Jira configuration saved', service: jiraService });
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error });
  }
});

router.post('/project', async (req: Request, res: Response) => {
  try {
    const { projectId, ...issueData } = jiraIssueSchema.parse(req.body);

    const jiraService = new JiraService(process.env.JIRA_BASE_URL || '', process.env.JIRA_API_KEY || '');
    const result = await jiraService.createIssue(projectId, issueData);

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create Jira issue', details: error });
  }
});

router.post('/sync-expiry/:deviceId', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;

    const jiraService = new JiraService(process.env.JIRA_BASE_URL || '', process.env.JIRA_API_KEY || '');
    const result = await jiraService.syncDeviceExpiry(deviceId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync device expiry', details: error });
  }
});

router.put('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const updates = req.body;

    const jiraService = new JiraService(process.env.JIRA_BASE_URL || '', process.env.JIRA_API_KEY || '');
    const result = await jiraService.updateProject(projectId, updates);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update Jira project', details: error });
  }
});

export default router;
