import db from '../db/init';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'manager';
  teamId?: string;
  avatar?: string;
  password?: string;
  createdAt: string;
  updatedAt: string;
}

export const UserModel = {
  create: (user: User) => {
    db.data.users.push({ ...user, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return user;
  },

  findAll: () => db.data.users,

  findById: (id: string) => db.data.users.find(user => user.id === id),

  findByEmail: (email: string) => db.data.users.find(user => user.email === email),

  update: (id: string, updates: Partial<User>) => {
    const index = db.data.users.findIndex(user => user.id === id);
    if (index !== -1) {
      db.data.users[index] = { ...db.data.users[index], ...updates, updatedAt: new Date().toISOString() };
    }
  },

  delete: (id: string) => {
    db.data.users = db.data.users.filter(user => user.id !== id);
  },

  verifyPassword: async (user: User, password: string): Promise<boolean> => {
    if (!user.password) return false;
    return await bcrypt.compare(password, user.password);
  },
};
