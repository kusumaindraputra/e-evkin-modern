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
import sequelize from './config/database';
import './models'; // Import models to load associations

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Note: sync({ alter: true }) disabled due to index naming conflicts with existing database
    // Use proper migrations for schema changes instead
    // To create missing tables only (safe), uncomment: await sequelize.sync({ force: false });
    console.log('ℹ️  Database sync disabled - using existing schema');

    // Start server
    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📍 Environment: ${config.env}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
