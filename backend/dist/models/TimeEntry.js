"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeEntryModel = void 0;
const init_1 = __importDefault(require("../db/init"));
exports.TimeEntryModel = {
    create: (entry) => {
        init_1.default.data.timeEntries.push({ ...entry, createdAt: new Date().toISOString() });
        return entry;
    },
    findAll: () => init_1.default.data.timeEntries,
    findByUser: (userId) => init_1.default.data.timeEntries.filter(entry => entry.userId === userId),
    getByDateRange: (startDate, endDate) => {
        return init_1.default.data.timeEntries
            .filter(entry => entry.date >= startDate && entry.date <= endDate);
    },
};
//# sourceMappingURL=TimeEntry.js.map