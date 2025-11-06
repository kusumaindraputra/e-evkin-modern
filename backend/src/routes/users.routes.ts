import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';

const router = Router();

// GET all puskesmas users (admin only)
router.get('/puskesmas', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      where: { role: 'puskesmas' },
      attributes: { exclude: ['password'] },
      order: [['nama_puskesmas', 'ASC']],
    });

    return res.json(users);
  } catch (error) {
    console.error('Error fetching puskesmas users:', error);
    return res.status(500).json({ message: 'Error fetching puskesmas users' });
  }
});

// GET single puskesmas user by ID (admin only)
router.get('/puskesmas/:id', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({
      where: { id, role: 'puskesmas' },
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'Puskesmas user not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Error fetching puskesmas user:', error);
    return res.status(500).json({ message: 'Error fetching puskesmas user' });
  }
});

// POST create new puskesmas user (admin only)
router.post('/puskesmas', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const {
      username,
      password,
      nama,
      kode_puskesmas,
      nama_puskesmas,
      id_blud,
      kecamatan,
      wilayah,
    } = req.body;

    // Validation
    if (!username || !password || !nama || !nama_puskesmas) {
      return res.status(400).json({
        message: 'username, password, nama, and nama_puskesmas are required',
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
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
  } catch (error) {
    console.error('Error creating puskesmas user:', error);
    return res.status(500).json({ message: 'Error creating puskesmas user' });
  }
});

// PUT update puskesmas user (admin only)
router.put('/puskesmas/:id', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      username,
      password,
      nama,
      kode_puskesmas,
      nama_puskesmas,
      id_blud,
      kecamatan,
      wilayah,
    } = req.body;

    const user = await User.findOne({ where: { id, role: 'puskesmas' } });
    if (!user) {
      return res.status(404).json({ message: 'Puskesmas user not found' });
    }

    // Check username uniqueness if changing
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }

    // Prepare update data
    const updateData: any = {
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
      updateData.password = await bcrypt.hash(password, 10);
    }

    await user.update(updateData);

    // Return without password
    const userWithoutPassword = user.toJSON();
    delete userWithoutPassword.password;

    return res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating puskesmas user:', error);
    return res.status(500).json({ message: 'Error updating puskesmas user' });
  }
});

// DELETE puskesmas user (admin only)
router.delete('/puskesmas/:id', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ where: { id, role: 'puskesmas' } });
    if (!user) {
      return res.status(404).json({ message: 'Puskesmas user not found' });
    }

    await user.destroy();
    return res.json({ message: 'Puskesmas user deleted successfully' });
  } catch (error) {
    console.error('Error deleting puskesmas user:', error);
    return res.status(500).json({ message: 'Error deleting puskesmas user' });
  }
});

export default router;
