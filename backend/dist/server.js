"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Suppress canvas polyfill warnings from pdfjs-dist (we only need text extraction)
const originalWarn = console.warn;
console.warn = (...args) => {
    const msg = args[0];
    if (typeof msg === 'string' && msg.includes('Cannot polyfill')) {
        return;
    }
    originalWarn.apply(console, args);
};
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const database_1 = __importDefault(require("./config/database"));
require("./models"); // Import models to load associations
const startServer = async () => {
    try {
        // Test database connection
        await database_1.default.authenticate();
        console.log('✅ Database connected successfully');
        // Note: sync({ alter: true }) disabled due to index naming conflicts with existing database
        // Use proper migrations for schema changes instead
        // To create missing tables only (safe), uncomment: await sequelize.sync({ force: false });
        console.log('ℹ️  Database sync disabled - using existing schema');
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