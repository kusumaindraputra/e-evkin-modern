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

    // Create tables if they don't exist
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized');

    // Start server
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📍 Environment: ${config.env}`);
    });
  } catch (error) {
    logger.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
