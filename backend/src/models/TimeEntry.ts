import db from '../db/init';

export interface TimeEntry {
  id: string;
  userId: string;
  date: string;
  hours: number;
  projectId?: string;
  description: string;
  teamId?: string;
  createdAt: string;
}

export const TimeEntryModel = {
  create: (entry: TimeEntry) => {
    db.data.timeEntries.push({ ...entry, createdAt: new Date().toISOString() });
    return entry;
  },

  findAll: () => db.data.timeEntries,

  findByUser: (userId: string) => db.data.timeEntries.filter(entry => entry.userId === userId),

  getByDateRange: (startDate: string, endDate: string) => {
    return db.data.timeEntries
      .filter(entry => entry.date >= startDate && entry.date <= endDate);
  },
};
