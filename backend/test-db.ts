import { sequelize } from './src/config/database';

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    console.log('Database:', sequelize.config.database);
    console.log('Host:', sequelize.config.host);
    console.log('Port:', sequelize.config.port);
    console.log('User:', sequelize.config.username);
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
