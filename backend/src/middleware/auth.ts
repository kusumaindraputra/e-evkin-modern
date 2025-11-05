import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    (req as any).user = decoded;
    next();
  } catch (error: any) {
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};
