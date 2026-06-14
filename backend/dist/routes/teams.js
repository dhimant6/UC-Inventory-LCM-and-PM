"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Team_1 = require("../models/Team");
const router = express_1.default.Router();
router.post('/', async (req, res) => {
    try {
        const team = Team_1.TeamModel.create({
            id: Math.random().toString(36).substring(7),
            ...req.body,
        });
        res.status(201).json(team);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid input', details: error });
    }
});
router.get('/', (req, res) => {
    try {
        const teams = Team_1.TeamModel.findAll();
        res.json(teams);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});
router.get('/:id', (req, res) => {
    try {
        const team = Team_1.TeamModel.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        res.json(team);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});
exports.default = router;
//# sourceMappingURL=teams.js.map