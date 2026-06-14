"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lowdb_1 = require("lowdb");
const path_1 = __importDefault(require("path"));
const adapter = new lowdb_1.JSONFile(path_1.default.join(__dirname, 'data.json'));
const db = new lowdb_1.Low(adapter);
// Initialize with default data
const defaultData = {
    devices: [],
    teams: [],
    phones: [],
    users: [],
    projects: [],
    timeEntries: [],
    forecasts: []
};
db.data = defaultData;
exports.default = db;
//# sourceMappingURL=init.js.map