import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { config } from '../config';

const router = Router();

// Login
router.post('/login', async (req: Request, res: Response) => {
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
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    res.json({
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
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
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

    res.json({
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      nama_puskesmas: user.nama_puskesmas,
      kecamatan: user.kecamatan,
      wilayah: user.wilayah,
    });
  } catch (error: any) {
    console.error('Auth verification error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Logout (client-side handled, just for API completeness)
router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logout successful' });
});

export default router;
