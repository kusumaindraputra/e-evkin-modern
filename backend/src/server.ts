import app from './app';
import { config } from './config';
import sequelize from './config/database';
import './models'; // Import models to load associations

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Sync models (in development)
    if (config.env === 'development') {
      // Skip sync - database schema already created
      // await sequelize.sync({ alter: true });
      console.log('✅ Database schema ready (sync skipped)');
    }

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
