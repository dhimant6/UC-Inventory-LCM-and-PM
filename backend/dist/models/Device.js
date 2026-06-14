"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceModel = void 0;
const init_1 = __importDefault(require("../db/init"));
exports.DeviceModel = {
    create: (device) => {
        init_1.default.data.devices.push({ ...device, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        return device;
    },
    findAll: () => init_1.default.data.devices,
    findById: (id) => init_1.default.data.devices.find(device => device.id === id),
    update: (id, updates) => {
        const index = init_1.default.data.devices.findIndex(device => device.id === id);
        if (index !== -1) {
            init_1.default.data.devices[index] = { ...init_1.default.data.devices[index], ...updates, updatedAt: new Date().toISOString() };
        }
    },
    delete: (id) => {
        init_1.default.data.devices = init_1.default.data.devices.filter(device => device.id !== id);
    },
    getByTeam: (teamId) => init_1.default.data.devices.filter(device => device.assignedTo === teamId),
};
//# sourceMappingURL=Device.js.map