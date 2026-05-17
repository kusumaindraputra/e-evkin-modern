import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';
import User from '../models/User';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;

    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'role'],
    });

    if (!user) {
      res.status(401).json({ message: 'Akun tidak ditemukan atau sudah dihapus' });
      return;
    }

    (req as any).user = { id: user.id, username: user.username, role: user.role };
    next();
  } catch (error: any) {
    res.status(401).json({ message: 'Token tidak valid atau sudah kadaluarsa' });
  }
};
