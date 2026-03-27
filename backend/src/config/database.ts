import { Sequelize } from 'sequelize';
import { config } from './index';
import logger from '../utils/logger';

const SLOW_QUERY_THRESHOLD_MS = 500;

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.user,
  password: config.database.password,
  logging: (sql: string, timing?: number) => {
    if (config.env === 'development') {
      console.log(sql);
    }
    // Log slow queries in all environments
    if (typeof timing === 'number' && timing > SLOW_QUERY_THRESHOLD_MS) {
      logger.warn(`SLOW QUERY (${timing}ms): ${sql}`);
    }
  },
  benchmark: true, // Enable query timing
  pool: {
    max: 20,        // 10 per cluster instance, 20 total for 80+ concurrent users
    min: 3,         // Keep more warm connections ready
    acquire: 30000, // 30s acquire timeout
    idle: 10000,    // Release idle connections after 10s
    evict: 1000,    // Check for idle connections every 1s
  },
  define: {
    timestamps: true,
    underscored: true,
  },
});

export { sequelize };
export default sequelize;
