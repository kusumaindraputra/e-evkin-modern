"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const index_1 = require("./index");
const sequelize = new sequelize_1.Sequelize({
    dialect: 'postgres',
    host: index_1.config.database.host,
    port: index_1.config.database.port,
    database: index_1.config.database.name,
    username: index_1.config.database.user,
    password: index_1.config.database.password,
    logging: index_1.config.env === 'development' ? console.log : false,
    pool: {
        max: 15, // Increased from 5 for better concurrency
        min: 2, // Maintain minimum active connections
        acquire: 60000, // Increased timeout for high load (60s)
        idle: 10000, // Keep idle timeout at 10s
    },
    define: {
        timestamps: true,
        underscored: true,
    },
});
exports.sequelize = sequelize;
exports.default = sequelize;
//# sourceMappingURL=database.js.map