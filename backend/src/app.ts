import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import 'express-async-errors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth.routes';
import puskesmasRoutes from './routes/puskesmas.routes';
import laporanRoutes from './routes/laporan.routes';
import adminRoutes from './routes/admin.routes';
import referenceRoutes from './routes/reference.routes';
import exportRoutes from './routes/export.routes';
import masterdataRoutes from './routes/masterdata.routes';
import kegiatanRoutes from './routes/kegiatan.routes';
import usersRoutes from './routes/users.routes';
import reportRoutes from './routes/report.routes';
import puskesmasConfigRoutes from './routes/puskesmas-config.routes';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(rateLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/puskesmas', puskesmasRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reference', referenceRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/masterdata', masterdataRoutes);
app.use('/api/kegiatan', kegiatanRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/puskesmas-config', puskesmasConfigRoutes);

// Error handling
app.use(errorHandler);

export default app;
