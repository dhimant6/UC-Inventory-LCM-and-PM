import db from '../db/init';

export interface Device {
  id: string;
  name: string;
  type: 'teams' | 'webex' | 'polycom' | 'other';
  model: string;
  serialNumber: string;
  ipAddress: string;
  macAddress: string;
  status: 'active' | 'inactive' | 'maintenance' | 'expired';
  purchaseDate: string;
  expiryDate: string;
  assignedTo?: string;
  location: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const DeviceModel = {
  create: (device: Device) => {
    db.data.devices.push({ ...device, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return device;
  },

  findAll: () => db.data.devices,

  findById: (id: string) => db.data.devices.find(device => device.id === id),

  update: (id: string, updates: Partial<Device>) => {
    const index = db.data.devices.findIndex(device => device.id === id);
    if (index !== -1) {
      db.data.devices[index] = { ...db.data.devices[index], ...updates, updatedAt: new Date().toISOString() };
    }
  },

  delete: (id: string) => {
    db.data.devices = db.data.devices.filter(device => device.id !== id);
  },

  getByTeam: (teamId: string) => db.data.devices.filter(device => device.assignedTo === teamId),
};
