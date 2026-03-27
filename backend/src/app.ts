import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import 'express-async-errors';
import { config } from './config';
import { setupSwagger } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import sequelize from './config/database';
import { cacheService } from './services/cacheService';
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
import subKegiatanSumberAnggaranRoutes from './routes/sub-kegiatan-sumber-anggaran.routes';
import chatRoutes from './routes/chat.routes';
import targetRoutes from './routes/target.routes';
import targetUploadRoutes from './routes/target-upload.routes';
import angkasRoutes from './routes/angkas.routes';

const app: Application = express();

// Trust proxy (behind nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(rateLimiter);

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Swagger API Documentation
setupSwagger(app);

// Health check with optional diagnostics (detail only from localhost/internal)
app.get('/health', async (req, res) => {
  const basic = { status: 'OK', timestamp: new Date().toISOString() };

  if (req.query.detail === 'true') {
    const clientIp = req.ip || req.socket.remoteAddress || '';
    const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1';
    if (!isLocal) {
      res.json(basic);
      return;
    }

    let poolStats = null;
    try {
      const pool = (sequelize as any).connectionManager?.pool;
      if (pool) {
        poolStats = {
          size: pool.size ?? pool._count ?? null,
          available: pool.available ?? pool._availableObjectsCount?.() ?? null,
          using: pool.using ?? pool._inUseObjectsCount?.() ?? null,
          waiting: pool.waiting ?? pool._waitingClientsCount?.() ?? null,
        };
      }
    } catch { /* pool introspection failed — ignore */ }

    res.json({
      ...basic,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      dbPool: poolStats,
      cache: cacheService.stats(),
    });
    return;
  }

  res.json(basic);
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'E-EVKIN API Microservice is running', 
    version: '1.0.0',
    docs: '/api-docs'
  });
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
app.use('/api/sub-kegiatan-sumber-anggaran', subKegiatanSumberAnggaranRoutes);
app.use('/api/admin', chatRoutes);
app.use('/api/target', targetRoutes);
app.use('/api/target', targetUploadRoutes);
app.use('/api/angkas', angkasRoutes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Error handling
app.use(errorHandler);

export default app;
