"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamModel = void 0;
const init_1 = __importDefault(require("../db/init"));
exports.TeamModel = {
    create: (team) => {
        init_1.default.data.teams.push({ ...team, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        return team;
    },
    findAll: () => init_1.default.data.teams,
    findById: (id) => init_1.default.data.teams.find(team => team.id === id),
    update: (id, updates) => {
        const index = init_1.default.data.teams.findIndex(team => team.id === id);
        if (index !== -1) {
            init_1.default.data.teams[index] = { ...init_1.default.data.teams[index], ...updates, updatedAt: new Date().toISOString() };
        }
    },
    delete: (id) => {
        init_1.default.data.teams = init_1.default.data.teams.filter(team => team.id !== id);
    },
};
//# sourceMappingURL=Team.js.map