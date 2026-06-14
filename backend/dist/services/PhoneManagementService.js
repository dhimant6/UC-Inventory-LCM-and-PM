"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneManagementService = void 0;
const Phone_1 = require("../models/Phone");
const Team_1 = require("../models/Team");
const User_1 = require("../models/User");
class PhoneManagementService {
    async addPhoneNumber(phoneData) {
        try {
            const team = Team_1.TeamModel.findById(phoneData.teamId);
            if (!team) {
                throw new Error('Team not found');
            }
            if (phoneData.assignedTo) {
                const user = User_1.UserModel.findById(phoneData.assignedTo);
                if (!user) {
                    throw new Error('User not found');
                }
                if (user.teamId !== phoneData.teamId) {
                    throw new Error('User does not belong to the specified team');
                }
            }
            const existingPhone = Phone_1.PhoneModel.findAll().find(p => p.number === phoneData.number);
            if (existingPhone) {
                throw new Error('Phone number already exists');
            }
            const phone = Phone_1.PhoneModel.create({
                id: Math.random().toString(36).substring(7),
                ...phoneData,
            });
            return phone;
        }
        catch (error) {
            console.error('Add phone number error:', error);
            throw error;
        }
    }
    async getAllPhoneNumbers() {
        try {
            return Phone_1.PhoneModel.findAll();
        }
        catch (error) {
            console.error('Get all phone numbers error:', error);
            throw error;
        }
    }
    async getPhoneById(phoneId) {
        try {
            return Phone_1.PhoneModel.findById(phoneId);
        }
        catch (error) {
            console.error('Get phone by ID error:', error);
            throw error;
        }
    }
    async updatePhoneNumber(phoneId, updates) {
        try {
            const phone = Phone_1.PhoneModel.findById(phoneId);
            if (!phone) {
                throw new Error('Phone not found');
            }
            Phone_1.PhoneModel.update(phoneId, updates);
            return Phone_1.PhoneModel.findById(phoneId);
        }
        catch (error) {
            console.error('Update phone number error:', error);
            throw error;
        }
    }
    async deletePhoneNumber(phoneId) {
        try {
            const phone = Phone_1.PhoneModel.findById(phoneId);
            if (!phone) {
                throw new Error('Phone not found');
            }
            Phone_1.PhoneModel.delete(phoneId);
        }
        catch (error) {
            console.error('Delete phone number error:', error);
            throw error;
        }
    }
    async assignPhoneToUser(phoneId, userId) {
        try {
            const phone = Phone_1.PhoneModel.findById(phoneId);
            if (!phone) {
                throw new Error('Phone not found');
            }
            const user = User_1.UserModel.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            if (phone.teamId !== user.teamId) {
                throw new Error('User does not belong to the same team');
            }
            Phone_1.PhoneModel.update(phoneId, {
                assignedTo: userId,
                status: 'active'
            });
            return Phone_1.PhoneModel.findById(phoneId);
        }
        catch (error) {
            console.error('Assign phone to user error:', error);
            throw error;
        }
    }
    async unassignPhone(phoneId) {
        try {
            const phone = Phone_1.PhoneModel.findById(phoneId);
            if (!phone) {
                throw new Error('Phone not found');
            }
            Phone_1.PhoneModel.update(phoneId, {
                assignedTo: undefined,
                status: 'inactive'
            });
        }
        catch (error) {
            console.error('Unassign phone error:', error);
            throw error;
        }
    }
    async removePhoneNumber(phoneId) {
        try {
            const phone = Phone_1.PhoneModel.findById(phoneId);
            if (!phone) {
                throw new Error('Phone not found');
            }
            Phone_1.PhoneModel.delete(phoneId);
        }
        catch (error) {
            console.error('Remove phone number error:', error);
            throw error;
        }
    }
    async reassignPhone(phoneId, newAssigneeId) {
        try {
            const phone = Phone_1.PhoneModel.findById(phoneId);
            if (!phone) {
                throw new Error('Phone not found');
            }
            const newAssignee = User_1.UserModel.findById(newAssigneeId);
            if (!newAssignee) {
                throw new Error('New assignee not found');
            }
            if (phone.teamId !== newAssignee.teamId) {
                throw new Error('New assignee does not belong to the same team');
            }
            Phone_1.PhoneModel.update(phoneId, {
                assignedTo: newAssigneeId,
                status: 'active'
            });
            return Phone_1.PhoneModel.findById(phoneId);
        }
        catch (error) {
            console.error('Reassign phone error:', error);
            throw error;
        }
    }
    async getPhoneAssignmentHistory(phoneId) {
        try {
            const phone = Phone_1.PhoneModel.findById(phoneId);
            if (!phone) {
                throw new Error('Phone not found');
            }
            const history = [];
            if (phone.assignedTo) {
                const user = User_1.UserModel.findById(phone.assignedTo);
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
        }
        catch (error) {
            console.error('Get phone assignment history error:', error);
            throw error;
        }
    }
    async bulkImportPhoneNumbers(phoneDataList) {
        try {
            const results = [];
            const errors = [];
            for (const phoneData of phoneDataList) {
                try {
                    const result = await this.addPhoneNumber(phoneData);
                    results.push({ success: true, data: result });
                }
                catch (error) {
                    errors.push({ data: phoneData, error: error.message });
                }
            }
            return {
                successful: results,
                errors: errors
            };
        }
        catch (error) {
            console.error('Bulk import phone numbers error:', error);
            throw error;
        }
    }
}
exports.PhoneManagementService = PhoneManagementService;
//# sourceMappingURL=PhoneManagementService.js.map