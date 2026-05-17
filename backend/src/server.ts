// Suppress canvas polyfill warnings from pdfjs-dist (we only need text extraction)
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = args[0];
  if (typeof msg === 'string' && msg.includes('Cannot polyfill')) {
    return;
  }
  originalWarn.apply(console, args);
};

import app from './app';
import { config } from './config';
import logger from './utils/logger';
import sequelize from './config/database';
import './models'; // Import models to load associations

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📍 Environment: ${config.env}`);

      // Signal PM2 that the app is ready (for graceful reload)
      if (typeof process.send === 'function') {
        process.send('ready');
      }
    });

    // Graceful shutdown handler
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed.');

        try {
          // Close database connections
          await sequelize.close();
          logger.info('Database connections closed.');
        } catch (err) {
          logger.error('Error closing database:', err);
        }

        process.exit(0);
      });

      // Force shutdown after 10s if graceful shutdown fails
      setTimeout(() => {
        logger.error('Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions and unhandled rejections
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection:', reason);
    });

  } catch (error) {
    logger.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
