"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const config_1 = require("../config");
const router = (0, express_1.Router)();
// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('🔑 Login attempt:', { username, password: '***' });
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        // Find user
        const user = await User_1.default.findOne({ where: { username } });
        console.log('👤 User found:', user ? 'Yes' : 'No');
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Log password hash for debugging
        console.log('🔐 Stored hash starts with:', user.password?.substring(0, 10));
        console.log('🔑 Input password:', password);
        // Verify password
        const isValidPassword = await user.comparePassword(password);
        console.log('✅ Password valid:', isValidPassword);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            username: user.username,
            role: user.role
        }, config_1.config.jwt.secret, { expiresIn: '7d' });
        // Return user data (without password)
        return res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                nama: user.nama,
                role: user.role,
                nama_puskesmas: user.nama_puskesmas,
                kecamatan: user.kecamatan,
                wilayah: user.wilayah,
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Login failed', message: error.message });
    }
});
// Get current user (verify token)
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        const user = await User_1.default.findByPk(decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({
            id: user.id,
            username: user.username,
            nama: user.nama,
            role: user.role,
            nama_puskesmas: user.nama_puskesmas,
            kecamatan: user.kecamatan,
            wilayah: user.wilayah,
        });
    }
    catch (error) {
        console.error('Auth verification error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
});
// Logout (client-side handled, just for API completeness)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logout successful' });
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map