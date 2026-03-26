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
