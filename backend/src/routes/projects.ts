import express, { Request, Response } from 'express';
import { z } from 'zod';
import { ProjectModel } from '../models/Project';
import { DeviceModel } from '../models/Device';
import { TeamModel } from '../models/Team';

const router = express.Router();

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).default('active'),
  deviceId: z.string().min(2),
  jiraId: z.string().optional(),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }).optional(),
  assignedTeam: z.string().optional(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const projectData = projectSchema.parse(req.body);

    const device = DeviceModel.findById(projectData.deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (projectData.assignedTeam) {
      const team = TeamModel.findById(projectData.assignedTeam);
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }
    }

    const project = ProjectModel.create({
      id: Math.random().toString(36).substring(7),
      ...projectData,
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error });
  }
});

router.get('/', (req: Request, res: Response) => {
  try {
    const projects = ProjectModel.findAll();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const project = ProjectModel.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const project = ProjectModel.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updates = projectSchema.partial().parse(req.body);
    ProjectModel.update(req.params.id, updates);

    const updatedProject = ProjectModel.findById(req.params.id);
    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const project = ProjectModel.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    ProjectModel.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

router.get('/device/:deviceId', (req: Request, res: Response) => {
  try {
    const projects = ProjectModel.getByDevice(req.params.deviceId);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects for device' });
  }
});

export default router;
