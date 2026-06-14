import { Low, JSONFile } from 'lowdb';
import path from 'path';

const adapter = new JSONFile(path.join(__dirname, 'data.json'));
const db = new Low(adapter);

// Initialize with default data
const defaultData = {
  devices: [],
  teams: [],
  phones: [],
  users: [],
  projects: [],
  timeEntries: [],
  forecasts: []
};

db.data = defaultData;

export default db;
