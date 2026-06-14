"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForecastModel = void 0;
const init_1 = __importDefault(require("../db/init"));
exports.ForecastModel = {
    create: (forecast) => {
        init_1.default.data.forecasts.push({ ...forecast, createdAt: new Date().toISOString() });
        return forecast;
    },
    findAll: () => init_1.default.data.forecasts,
    findByTeam: (teamId) => init_1.default.data.forecasts.filter(forecast => forecast.teamId === teamId),
    update: (id, updates) => {
        const index = init_1.default.data.forecasts.findIndex(forecast => forecast.id === id);
        if (index !== -1) {
            init_1.default.data.forecasts[index] = { ...init_1.default.data.forecasts[index], ...updates };
        }
    },
};
//# sourceMappingURL=Forecast.js.map