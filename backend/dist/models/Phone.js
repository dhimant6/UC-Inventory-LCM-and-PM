"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneModel = void 0;
const init_1 = __importDefault(require("../db/init"));
exports.PhoneModel = {
    create: (phone) => {
        init_1.default.data.phones.push({ ...phone, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        return phone;
    },
    findAll: () => init_1.default.data.phones,
    findById: (id) => init_1.default.data.phones.find(phone => phone.id === id),
    update: (id, updates) => {
        const index = init_1.default.data.phones.findIndex(phone => phone.id === id);
        if (index !== -1) {
            init_1.default.data.phones[index] = { ...init_1.default.data.phones[index], ...updates, updatedAt: new Date().toISOString() };
        }
    },
    delete: (id) => {
        init_1.default.data.phones = init_1.default.data.phones.filter(phone => phone.id !== id);
    },
    getByTeam: (teamId) => init_1.default.data.phones.filter(phone => phone.teamId === teamId),
};
//# sourceMappingURL=Phone.js.map