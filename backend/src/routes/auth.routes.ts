import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { config } from '../config';
import { loginRateLimiter } from '../middleware/rateLimiter';
import logger from '../utils/logger';

const router = Router();

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
router.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as any }
    );

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
  } catch (error: any) {
    logger.error('Login error:', error);
    return res.status(500).json({ error: 'Login gagal. Silakan coba lagi.' });
  }
});

// Get current user (verify token)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    const user = await User.findByPk(decoded.id);

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
  } catch (error: any) {
    logger.error('Auth verification error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Logout (client-side handled, just for API completeness)
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear any server-side session if exists (future enhancement)
    res.json({ message: 'Logout successful' });
  } catch (error: any) {
    logger.error('Logout error:', error);
    res.status(500).json({
      message: 'Logout gagal',
    });
  }
});

export default router;
