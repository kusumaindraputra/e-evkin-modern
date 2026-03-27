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
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        // Find user
        const user = await User_1.default.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Verify password
        const isValidPassword = await user.comparePassword(password);
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
        return res.status(500).json({ error: 'Login gagal. Silakan coba lagi.' });
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
router.post('/logout', async (req, res) => {
    try {
        // Clear any server-side session if exists (future enhancement)
        res.json({ message: 'Logout successful' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            message: 'Logout gagal',
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map