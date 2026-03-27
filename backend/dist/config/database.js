"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const index_1 = require("./index");
const logger_1 = __importDefault(require("../utils/logger"));
const SLOW_QUERY_THRESHOLD_MS = 500;
const sequelize = new sequelize_1.Sequelize({
    dialect: 'postgres',
    host: index_1.config.database.host,
    port: index_1.config.database.port,
    database: index_1.config.database.name,
    username: index_1.config.database.user,
    password: index_1.config.database.password,
    logging: (sql, timing) => {
        if (index_1.config.env === 'development') {
            console.log(sql);
        }
        // Log slow queries in all environments
        if (typeof timing === 'number' && timing > SLOW_QUERY_THRESHOLD_MS) {
            logger_1.default.warn(`SLOW QUERY (${timing}ms): ${sql}`);
        }
    },
    benchmark: true, // Enable query timing
    pool: {
        max: 20, // 10 per cluster instance, 20 total for 80+ concurrent users
        min: 3, // Keep more warm connections ready
        acquire: 30000, // 30s acquire timeout
        idle: 10000, // Release idle connections after 10s
        evict: 1000, // Check for idle connections every 1s
    },
    define: {
        timestamps: true,
        underscored: true,
    },
});
exports.sequelize = sequelize;
exports.default = sequelize;
//# sourceMappingURL=database.js.map