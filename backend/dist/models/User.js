"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const init_1 = __importDefault(require("../db/init"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.UserModel = {
    create: (user) => {
        init_1.default.data.users.push({ ...user, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        return user;
    },
    findAll: () => init_1.default.data.users,
    findById: (id) => init_1.default.data.users.find(user => user.id === id),
    findByEmail: (email) => init_1.default.data.users.find(user => user.email === email),
    update: (id, updates) => {
        const index = init_1.default.data.users.findIndex(user => user.id === id);
        if (index !== -1) {
            init_1.default.data.users[index] = { ...init_1.default.data.users[index], ...updates, updatedAt: new Date().toISOString() };
        }
    },
    delete: (id) => {
        init_1.default.data.users = init_1.default.data.users.filter(user => user.id !== id);
    },
    verifyPassword: async (user, password) => {
        if (!user.password)
            return false;
        return await bcryptjs_1.default.compare(password, user.password);
    },
};
//# sourceMappingURL=User.js.map