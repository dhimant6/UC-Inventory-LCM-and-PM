"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_2 = require("express");
const auth_1 = __importDefault(require("./routes/auth"));
const devices_1 = __importDefault(require("./routes/devices"));
const teams_1 = __importDefault(require("./routes/teams"));
const phones_1 = __importDefault(require("./routes/phones"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use((0, express_2.json)());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/devices', devices_1.default);
app.use('/api/teams', teams_1.default);
app.use('/api/phones', phones_1.default);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map