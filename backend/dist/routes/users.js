"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const User_1 = require("../models/User");
const router = express_1.default.Router();
const userSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(2),
    role: zod_1.z.enum(['admin', 'user', 'manager']),
    teamId: zod_1.z.string().optional(),
    avatar: zod_1.z.string().optional(),
    password: zod_1.z.string().min(8).optional(),
});
router.post('/', async (req, res) => {
    try {
        const userData = userSchema.parse(req.body);
        const existingUser = User_1.UserModel.findByEmail(userData.email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : undefined;
        const user = User_1.UserModel.create({
            id: Math.random().toString(36).substring(7),
            ...userData,
            password: hashedPassword,
        });
        res.status(201).json(user);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid input', details: error });
    }
});
router.get('/', (req, res) => {
    try {
        const users = User_1.UserModel.findAll();
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
router.get('/:id', (req, res) => {
    try {
        const user = User_1.UserModel.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const user = User_1.UserModel.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const updates = userSchema.partial().parse(req.body);
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }
        User_1.UserModel.update(req.params.id, updates);
        const updatedUser = User_1.UserModel.findById(req.params.id);
        res.json(updatedUser);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid input', details: error });
    }
});
router.delete('/:id', (req, res) => {
    try {
        const user = User_1.UserModel.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        User_1.UserModel.delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map