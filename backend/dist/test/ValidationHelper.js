"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationHelper = exports.TestHelper = void 0;
const Device_1 = require("../models/Device");
const Team_1 = require("../models/Team");
const Phone_1 = require("../models/Phone");
const User_1 = require("../models/User");
class TestHelper {
    static async setupTestData() {
        const testTeam = Team_1.TeamModel.create({
            id: 'test-team-1',
            name: 'Test Team',
            department: 'Engineering',
            managerId: 'test-user-1',
            location: 'Test Location',
            contactEmail: 'test@example.com',
            contactPhone: '+1234567890',
        });
        const testUser = User_1.UserModel.create({
            id: 'test-user-1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'admin',
            teamId: testTeam.id,
            password: '$2a$10$testhash',
        });
        const testDevice = Device_1.DeviceModel.create({
            id: 'test-device-1',
            name: 'Test Device',
            type: 'teams',
            model: 'Test Model',
            serialNumber: 'TEST123',
            ipAddress: '192.168.1.100',
            macAddress: '00:11:22:33:44:55',
            status: 'active',
            purchaseDate: '2023-01-01',
            expiryDate: '2024-01-01',
            assignedTo: testTeam.id,
            location: 'Test Location',
        });
        const testPhone = Phone_1.PhoneModel.create({
            id: 'test-phone-1',
            number: '+1234567890',
            type: 'mobile',
            teamId: testTeam.id,
            assignedTo: testUser.id,
            status: 'active',
            purchaseDate: '2023-01-01',
        });
        return {
            team: testTeam,
            user: testUser,
            device: testDevice,
            phone: testPhone,
        };
    }
    static async cleanupTestData() {
        const db = require('./db/init').default;
        db.data.devices = db.data.devices.filter(device => device.id !== 'test-device-1');
        db.data.teams = db.data.teams.filter(team => team.id !== 'test-team-1');
        db.data.phones = db.data.phones.filter(phone => phone.id !== 'test-phone-1');
        db.data.users = db.data.users.filter(user => user.id !== 'test-user-1');
    }
}
exports.TestHelper = TestHelper;
class ValidationHelper {
    static validateDevice(device) {
        const errors = [];
        if (!device.name)
            errors.push('Name is required');
        if (!device.type)
            errors.push('Type is required');
        if (!device.model)
            errors.push('Model is required');
        if (!device.serialNumber)
            errors.push('Serial number is required');
        if (!device.ipAddress)
            errors.push('IP address is required');
        if (!device.macAddress)
            errors.push('MAC address is required');
        if (!device.status)
            errors.push('Status is required');
        if (!device.purchaseDate)
            errors.push('Purchase date is required');
        if (!device.expiryDate)
            errors.push('Expiry date is required');
        if (!device.location)
            errors.push('Location is required');
        return errors;
    }
    static validateTeam(team) {
        const errors = [];
        if (!team.name)
            errors.push('Name is required');
        if (!team.department)
            errors.push('Department is required');
        if (!team.managerId)
            errors.push('Manager ID is required');
        if (!team.location)
            errors.push('Location is required');
        if (!team.contactEmail)
            errors.push('Contact email is required');
        if (!team.contactPhone)
            errors.push('Contact phone is required');
        return errors;
    }
    static validatePhone(phone) {
        const errors = [];
        if (!phone.number)
            errors.push('Number is required');
        if (!phone.type)
            errors.push('Type is required');
        if (!phone.teamId)
            errors.push('Team ID is required');
        if (!phone.status)
            errors.push('Status is required');
        if (!phone.purchaseDate)
            errors.push('Purchase date is required');
        return errors;
    }
    static validateUser(user) {
        const errors = [];
        if (!user.email)
            errors.push('Email is required');
        if (!user.name)
            errors.push('Name is required');
        if (!user.role)
            errors.push('Role is required');
        if (!user.password)
            errors.push('Password is required');
        return errors;
    }
}
exports.ValidationHelper = ValidationHelper;
//# sourceMappingURL=ValidationHelper.js.map