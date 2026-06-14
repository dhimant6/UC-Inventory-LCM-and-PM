import { TimeEntryModel } from '../models/TimeEntry';
import { ForecastModel } from '../models/Forecast';
import { TeamModel } from '../models/Team';
import { UserModel } from '../models/User';

export class ServiceNowService {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async syncTimeEntries(teamId: string): Promise<any[]> {
    try {
      const team = TeamModel.findById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      const users = UserModel.findAll().filter(user => user.teamId === teamId);
      const timeEntries = TimeEntryModel.findAll().filter(entry => entry.teamId === teamId);

      const serviceNowRecords = timeEntries.map(entry => {
        const user = users.find(u => u.id === entry.userId);
        return {
          table: 'sc_task',
          sys_id: entry.id,
          short_description: entry.description,
          description: `Time entry for ${user?.name || 'Unknown user'}\nHours: ${entry.hours}\nDate: ${entry.date}`,
          assigned_to: user?.id || '',
          state: '1', // In Progress
          active: true,
          start_date: entry.date,
          work_hours: entry.hours,
          category: 'UC Inventory',
          subcategory: 'Time Tracking',
          comments: `Synced from UC Inventory system`
        };
      });

      const response = await fetch(`${this.baseUrl}/api/now/table/sc_task`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(serviceNowRecords)
      });

      if (!response.ok) {
        throw new Error(`ServiceNow API error: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('ServiceNow sync time entries error:', error);
      throw error;
    }
  }

  async createForecast(forecastData: any): Promise<any> {
    try {
      const team = TeamModel.findById(forecastData.teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      const users = UserModel.findAll().filter(user => user.teamId === forecastData.teamId);
      const timeEntries = TimeEntryModel.findAll().filter(entry => entry.teamId === forecastData.teamId);

      const monthlyEntries = timeEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const currentDate = new Date();
        return entryDate.getMonth() === currentDate.getMonth() &&
               entryDate.getFullYear() === currentDate.getFullYear();
      });

      const totalHours = monthlyEntries.reduce((sum, entry) => sum + entry.hours, 0);
      const averageHoursPerUser = users.length > 0 ? totalHours / users.length : 0;

      const forecast = {
        table: 'fsc_forecast',
        sys_id: forecastData.id,
        short_description: `Team ${team.name} - ${forecastData.period} Forecast`,
        description: `Forecast for team ${team.name} for ${forecastData.period} period\n\nPeriod: ${forecastData.startDate} to ${forecastData.endDate}\nExpected Hours: ${forecastData.expectedHours}\nActual Hours: ${totalHours}\nVariance: ${forecastData.expectedHours - totalHours}\n\nBreakdown by User:\n${users.map(u => `  - ${u.name}: ${monthlyEntries.filter(e => e.userId === u.id).reduce((sum, e) => sum + e.hours, 0)} hours`).join('\n')}`,
        team: team.name,
        period: forecastData.period,
        start_date: forecastData.startDate,
        end_date: forecastData.endDate,
        expected_hours: forecastData.expectedHours,
        actual_hours: totalHours,
        variance: forecastData.expectedHours - totalHours,
        status: '1', // In Progress
        active: true,
        category: 'UC Inventory',
        subcategory: 'Forecasting',
        comments: `Auto-generated from UC Inventory system`
      };

      const response = await fetch(`${this.baseUrl}/api/now/table/fsc_forecast`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(forecast)
      });

      if (!response.ok) {
        throw new Error(`ServiceNow API error: ${response.status}`);
      }

      const result = await response.json();

      ForecastModel.update(forecastData.id, {
        actualHours: totalHours,
        variance: forecastData.expectedHours - totalHours
      });

      return result;
    } catch (error) {
      console.error('ServiceNow create forecast error:', error);
      throw error;
    }
  }

  async calculateTeamCapacity(teamId: string): Promise<any> {
    try {
      const team = TeamModel.findById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      const users = UserModel.findAll().filter(user => user.teamId === teamId);
      const timeEntries = TimeEntryModel.findAll().filter(entry => entry.teamId === teamId);

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const monthlyEntries = timeEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === currentMonth &&
               entryDate.getFullYear() === currentYear;
      });

      const totalHours = monthlyEntries.reduce((sum, entry) => sum + entry.hours, 0);
      const averageHoursPerUser = users.length > 0 ? totalHours / users.length : 0;
      const maxHoursPerUser = 160; // Standard full-time hours per month

      const capacityData = {
        teamId: teamId,
        teamName: team.name,
        totalUsers: users.length,
        totalHours: totalHours,
        averageHoursPerUser: averageHoursPerUser,
        maxHoursPerUser: maxHoursPerUser,
        utilizationRate: (totalHours / (users.length * maxHoursPerUser)) * 100,
        capacityStatus: averageHoursPerUser >= maxHoursPerUser * 0.9 ? 'overloaded' :
                       averageHoursPerUser >= maxHoursPerUser * 0.7 ? 'utilizing' :
                       averageHoursPerUser >= maxHoursPerUser * 0.3 ? 'underutilized' : 'available',
        month: currentMonth + 1,
        year: currentYear
      };

      return capacityData;
    } catch (error) {
      console.error('ServiceNow calculate capacity error:', error);
      throw error;
    }
  }
}
