import { Sequelize } from 'sequelize';
import { config } from './index';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.user,
  password: config.database.password,
  logging: config.env === 'development' ? console.log : false,
  pool: {
    max: 15,        // Increased from 5 for better concurrency
    min: 2,         // Maintain minimum active connections
    acquire: 60000, // Increased timeout for high load (60s)
    idle: 10000,    // Keep idle timeout at 10s
  },
  define: {
    timestamps: true,
    underscored: true,
  },
});

export { sequelize };
export default sequelize;
