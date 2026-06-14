import db from '../db/init';

export interface Forecast {
  id: string;
  teamId: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  expectedHours: number;
  actualHours?: number;
  variance?: number;
  notes?: string;
  createdAt: string;
}

export const ForecastModel = {
  create: (forecast: Forecast) => {
    db.data.forecasts.push({ ...forecast, createdAt: new Date().toISOString() });
    return forecast;
  },

  findAll: () => db.data.forecasts,

  findByTeam: (teamId: string) => db.data.forecasts.filter(forecast => forecast.teamId === teamId),

  update: (id: string, updates: Partial<Forecast>) => {
    const index = db.data.forecasts.findIndex(forecast => forecast.id === id);
    if (index !== -1) {
      db.data.forecasts[index] = { ...db.data.forecasts[index], ...updates };
    }
  },
};
