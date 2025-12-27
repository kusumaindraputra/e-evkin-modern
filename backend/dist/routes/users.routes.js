"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const router = (0, express_1.Router)();
// GET all puskesmas users (admin only)
router.get('/puskesmas', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const users = await User_1.default.findAll({
            where: { role: 'puskesmas' },
            attributes: { exclude: ['password'] },
            order: [['nama_puskesmas', 'ASC']],
        });
        return res.json(users);
    }
    catch (error) {
        console.error('Error fetching puskesmas users:', error);
        return res.status(500).json({ message: 'Error fetching puskesmas users' });
    }
});
// GET single puskesmas user by ID (admin only)
router.get('/puskesmas/:id', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User_1.default.findOne({
            where: { id, role: 'puskesmas' },
            attributes: { exclude: ['password'] },
        });
        if (!user) {
            return res.status(404).json({ message: 'Puskesmas user not found' });
        }
        return res.json(user);
    }
    catch (error) {
        console.error('Error fetching puskesmas user:', error);
        return res.status(500).json({ message: 'Error fetching puskesmas user' });
    }
});
// POST create new puskesmas user (admin only)
router.post('/puskesmas', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { username, password, nama, kode_puskesmas, nama_puskesmas, id_blud, kecamatan, wilayah, } = req.body;
        // Validation
        if (!username || !password || !nama || !nama_puskesmas) {
            return res.status(400).json({
                message: 'username, password, nama, and nama_puskesmas are required',
            });
        }
        // Check if username already exists
        const existingUser = await User_1.default.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Create user
        const newUser = await User_1.default.create({
            username,
            password: hashedPassword,
            nama,
            role: 'puskesmas',
            kode_puskesmas: kode_puskesmas || null,
            nama_puskesmas,
            id_blud: id_blud || null,
            kecamatan: kecamatan || null,
            wilayah: wilayah || null,
        });
        // Return without password
        const userWithoutPassword = newUser.toJSON();
        delete userWithoutPassword.password;
        return res.status(201).json(userWithoutPassword);
    }
    catch (error) {
        console.error('Error creating puskesmas user:', error);
        return res.status(500).json({ message: 'Error creating puskesmas user' });
    }
});
// PUT update puskesmas user (admin only)
router.put('/puskesmas/:id', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, nama, kode_puskesmas, nama_puskesmas, id_blud, kecamatan, wilayah, } = req.body;
        const user = await User_1.default.findOne({ where: { id, role: 'puskesmas' } });
        if (!user) {
            return res.status(404).json({ message: 'Puskesmas user not found' });
        }
        // Check username uniqueness if changing
        if (username && username !== user.username) {
            const existingUser = await User_1.default.findOne({ where: { username } });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }
        }
        // Prepare update data
        const updateData = {
            username: username || user.username,
            nama: nama || user.nama,
            kode_puskesmas: kode_puskesmas !== undefined ? kode_puskesmas : user.kode_puskesmas,
            nama_puskesmas: nama_puskesmas || user.nama_puskesmas,
            id_blud: id_blud !== undefined ? id_blud : user.id_blud,
            kecamatan: kecamatan !== undefined ? kecamatan : user.kecamatan,
            wilayah: wilayah !== undefined ? wilayah : user.wilayah,
        };
        // Hash new password if provided
        if (password) {
            updateData.password = await bcrypt_1.default.hash(password, 10);
        }
        await user.update(updateData);
        // Return without password
        const userWithoutPassword = user.toJSON();
        delete userWithoutPassword.password;
        return res.json(userWithoutPassword);
    }
    catch (error) {
        console.error('Error updating puskesmas user:', error);
        return res.status(500).json({ message: 'Error updating puskesmas user' });
    }
});
// DELETE puskesmas user (admin only)
router.delete('/puskesmas/:id', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User_1.default.findOne({ where: { id, role: 'puskesmas' } });
        if (!user) {
            return res.status(404).json({ message: 'Puskesmas user not found' });
        }
        await user.destroy();
        return res.json({ message: 'Puskesmas user deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting puskesmas user:', error);
        return res.status(500).json({ message: 'Error deleting puskesmas user' });
    }
});
exports.default = router;
//# sourceMappingURL=users.routes.js.map