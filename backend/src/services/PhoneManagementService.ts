import { PhoneModel } from '../models/Phone';
import { TeamModel } from '../models/Team';
import { UserModel } from '../models/User';

export class PhoneManagementService {
  async addPhoneNumber(phoneData: any): Promise<any> {
    try {
      const team = TeamModel.findById(phoneData.teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      if (phoneData.assignedTo) {
        const user = UserModel.findById(phoneData.assignedTo);
        if (!user) {
          throw new Error('User not found');
        }
        if (user.teamId !== phoneData.teamId) {
          throw new Error('User does not belong to the specified team');
        }
      }

      const existingPhone = PhoneModel.findAll().find(p => p.number === phoneData.number);
      if (existingPhone) {
        throw new Error('Phone number already exists');
      }

      const phone = PhoneModel.create({
        id: Math.random().toString(36).substring(7),
        ...phoneData,
      });

      return phone;
    } catch (error) {
      console.error('Add phone number error:', error);
      throw error;
    }
  }

  async getAllPhoneNumbers(): Promise<any[]> {
    try {
      return PhoneModel.findAll();
    } catch (error) {
      console.error('Get all phone numbers error:', error);
      throw error;
    }
  }

  async getPhoneById(phoneId: string): Promise<any> {
    try {
      return PhoneModel.findById(phoneId);
    } catch (error) {
      console.error('Get phone by ID error:', error);
      throw error;
    }
  }

  async updatePhoneNumber(phoneId: string, updates: any): Promise<any> {
    try {
      const phone = PhoneModel.findById(phoneId);
      if (!phone) {
        throw new Error('Phone not found');
      }

      PhoneModel.update(phoneId, updates);
      return PhoneModel.findById(phoneId);
    } catch (error) {
      console.error('Update phone number error:', error);
      throw error;
    }
  }

  async deletePhoneNumber(phoneId: string): Promise<void> {
    try {
      const phone = PhoneModel.findById(phoneId);
      if (!phone) {
        throw new Error('Phone not found');
      }

      PhoneModel.delete(phoneId);
    } catch (error) {
      console.error('Delete phone number error:', error);
      throw error;
    }
  }

  async assignPhoneToUser(phoneId: string, userId: string): Promise<any> {
    try {
      const phone = PhoneModel.findById(phoneId);
      if (!phone) {
        throw new Error('Phone not found');
      }

      const user = UserModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (phone.teamId !== user.teamId) {
        throw new Error('User does not belong to the same team');
      }

      PhoneModel.update(phoneId, {
        assignedTo: userId,
        status: 'active'
      });

      return PhoneModel.findById(phoneId);
    } catch (error) {
      console.error('Assign phone to user error:', error);
      throw error;
    }
  }

  async unassignPhone(phoneId: string): Promise<void> {
    try {
      const phone = PhoneModel.findById(phoneId);
      if (!phone) {
        throw new Error('Phone not found');
      }

      PhoneModel.update(phoneId, {
        assignedTo: undefined,
        status: 'inactive'
      });
    } catch (error) {
      console.error('Unassign phone error:', error);
      throw error;
    }
  }

  async removePhoneNumber(phoneId: string): Promise<void> {
    try {
      const phone = PhoneModel.findById(phoneId);
      if (!phone) {
        throw new Error('Phone not found');
      }

      PhoneModel.delete(phoneId);
    } catch (error) {
      console.error('Remove phone number error:', error);
      throw error;
    }
  }

  async reassignPhone(phoneId: string, newAssigneeId: string): Promise<any> {
    try {
      const phone = PhoneModel.findById(phoneId);
      if (!phone) {
        throw new Error('Phone not found');
      }

      const newAssignee = UserModel.findById(newAssigneeId);
      if (!newAssignee) {
        throw new Error('New assignee not found');
      }

      if (phone.teamId !== newAssignee.teamId) {
        throw new Error('New assignee does not belong to the same team');
      }

      PhoneModel.update(phoneId, {
        assignedTo: newAssigneeId,
        status: 'active'
      });

      return PhoneModel.findById(phoneId);
    } catch (error) {
      console.error('Reassign phone error:', error);
      throw error;
    }
  }

  async getPhoneAssignmentHistory(phoneId: string): Promise<any[]> {
    try {
      const phone = PhoneModel.findById(phoneId);
      if (!phone) {
        throw new Error('Phone not found');
      }

      const history = [];

      if (phone.assignedTo) {
        const user = UserModel.findById(phone.assignedTo);
        if (user) {
          history.push({
            event: 'assigned',
            toUser: user.name,
            timestamp: new Date().toISOString(),
            notes: 'Phone assigned to user'
          });
        }
      }

      return history;
    } catch (error) {
      console.error('Get phone assignment history error:', error);
      throw error;
    }
  }

  async bulkImportPhoneNumbers(phoneDataList: any[]): Promise<any[]> {
    try {
      const results = [];
      const errors = [];

      for (const phoneData of phoneDataList) {
        try {
          const result = await this.addPhoneNumber(phoneData);
          results.push({ success: true, data: result });
        } catch (error) {
          errors.push({ data: phoneData, error: error.message });
        }
      }

      return {
        successful: results,
        errors: errors
      };
    } catch (error) {
      console.error('Bulk import phone numbers error:', error);
      throw error;
    }
  }
}
