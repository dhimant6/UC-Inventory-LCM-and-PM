import db from '../db/init';

export interface Team {
  id: string;
  name: string;
  department: string;
  managerId: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  devices?: string[];
  createdAt: string;
  updatedAt: string;
}

export const TeamModel = {
  create: (team: Team) => {
    db.data.teams.push({ ...team, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return team;
  },

  findAll: () => db.data.teams,

  findById: (id: string) => db.data.teams.find(team => team.id === id),

  update: (id: string, updates: Partial<Team>) => {
    const index = db.data.teams.findIndex(team => team.id === id);
    if (index !== -1) {
      db.data.teams[index] = { ...db.data.teams[index], ...updates, updatedAt: new Date().toISOString() };
    }
  },

  delete: (id: string) => {
    db.data.teams = db.data.teams.filter(team => team.id !== id);
  },
};
