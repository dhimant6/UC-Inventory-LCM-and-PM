"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectModel = void 0;
const init_1 = __importDefault(require("../db/init"));
exports.ProjectModel = {
    create: (project) => {
        init_1.default.data.projects.push({ ...project, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        return project;
    },
    findAll: () => init_1.default.data.projects,
    findById: (id) => init_1.default.data.projects.find(project => project.id === id),
    update: (id, updates) => {
        const index = init_1.default.data.projects.findIndex(project => project.id === id);
        if (index !== -1) {
            init_1.default.data.projects[index] = { ...init_1.default.data.projects[index], ...updates, updatedAt: new Date().toISOString() };
        }
    },
    delete: (id) => {
        init_1.default.data.projects = init_1.default.data.projects.filter(project => project.id !== id);
    },
    getByDevice: (deviceId) => init_1.default.data.projects.filter(project => project.deviceId === deviceId),
};
//# sourceMappingURL=Project.js.map