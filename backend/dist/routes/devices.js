"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Device_1 = require("../models/Device");
const router = express_1.default.Router();
router.post('/', async (req, res) => {
    try {
        const device = Device_1.DeviceModel.create({
            id: Math.random().toString(36).substring(7),
            ...req.body,
        });
        res.status(201).json(device);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid input', details: error });
    }
});
router.get('/', (req, res) => {
    try {
        const devices = Device_1.DeviceModel.findAll();
        res.json(devices);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch devices' });
    }
});
router.get('/:id', (req, res) => {
    try {
        const device = Device_1.DeviceModel.findById(req.params.id);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        res.json(device);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch device' });
    }
});
exports.default = router;
//# sourceMappingURL=devices.js.map