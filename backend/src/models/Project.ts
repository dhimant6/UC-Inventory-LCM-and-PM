import db from '../db/init';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  deviceId: string;
  jiraId?: string;
  startDate: string;
  endDate?: string;
  assignedTeam?: string;
  createdAt: string;
  updatedAt: string;
}

export const ProjectModel = {
  create: (project: Project) => {
    db.data.projects.push({ ...project, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return project;
  },

  findAll: () => db.data.projects,

  findById: (id: string) => db.data.projects.find(project => project.id === id),

  update: (id: string, updates: Partial<Project>) => {
    const index = db.data.projects.findIndex(project => project.id === id);
    if (index !== -1) {
      db.data.projects[index] = { ...db.data.projects[index], ...updates, updatedAt: new Date().toISOString() };
    }
  },

  delete: (id: string) => {
    db.data.projects = db.data.projects.filter(project => project.id !== id);
  },

  getByDevice: (deviceId: string) => db.data.projects.filter(project => project.deviceId === deviceId),
};
