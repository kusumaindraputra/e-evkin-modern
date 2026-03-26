import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { config } from '../config';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  logger.error('ERROR:', err);

  return res.status(500).json({
    success: false,
    message: config.env === 'production'
      ? 'Terjadi kesalahan server. Silakan coba lagi.'
      : err.message || 'Something went wrong!',
  });
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan`,
  });
};
