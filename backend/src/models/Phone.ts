import db from '../db/init';

export interface Phone {
  id: string;
  number: string;
  type: 'mobile' | 'landline' | 'voip';
  teamId: string;
  assignedTo?: string;
  status: 'active' | 'inactive' | 'reserved';
  purchaseDate: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const PhoneModel = {
  create: (phone: Phone) => {
    db.data.phones.push({ ...phone, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return phone;
  },

  findAll: () => db.data.phones,

  findById: (id: string) => db.data.phones.find(phone => phone.id === id),

  update: (id: string, updates: Partial<Phone>) => {
    const index = db.data.phones.findIndex(phone => phone.id === id);
    if (index !== -1) {
      db.data.phones[index] = { ...db.data.phones[index], ...updates, updatedAt: new Date().toISOString() };
    }
  },

  delete: (id: string) => {
    db.data.phones = db.data.phones.filter(phone => phone.id !== id);
  },

  getByTeam: (teamId: string) => db.data.phones.filter(phone => phone.teamId === teamId),
};
