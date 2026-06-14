"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Phone_1 = require("../models/Phone");
const router = express_1.default.Router();
router.post('/', async (req, res) => {
    try {
        const phone = Phone_1.PhoneModel.create({
            id: Math.random().toString(36).substring(7),
            ...req.body,
        });
        res.status(201).json(phone);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid input', details: error });
    }
});
router.get('/', (req, res) => {
    try {
        const phones = Phone_1.PhoneModel.findAll();
        res.json(phones);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch phones' });
    }
});
router.get('/:id', (req, res) => {
    try {
        const phone = Phone_1.PhoneModel.findById(req.params.id);
        if (!phone) {
            return res.status(404).json({ error: 'Phone not found' });
        }
        res.json(phone);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch phone' });
    }
});
exports.default = router;
//# sourceMappingURL=phones.js.map