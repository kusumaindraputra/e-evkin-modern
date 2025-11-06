"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const database_1 = __importDefault(require("./config/database"));
require("./models"); // Import models to load associations
const startServer = async () => {
    try {
        // Test database connection
        await database_1.default.authenticate();
        console.log('✅ Database connected successfully');
        // Sync models (in development)
        if (config_1.config.env === 'development') {
            // Skip sync - database schema already created
            // await sequelize.sync({ alter: true });
            console.log('✅ Database schema ready (sync skipped)');
        }
        // Start server
        app_1.default.listen(config_1.config.port, () => {
            console.log(`🚀 Server running on port ${config_1.config.port}`);
            console.log(`📍 Environment: ${config_1.config.env}`);
        });
    }
    catch (error) {
        console.error('❌ Unable to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map