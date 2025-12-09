import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.env === 'development' ? 1000 : config.rateLimit.maxRequests, // Higher limit for dev
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
