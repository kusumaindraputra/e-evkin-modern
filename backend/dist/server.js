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
const logger_1 = __importDefault(require("./utils/logger"));
const database_1 = __importDefault(require("./config/database"));
require("./models"); // Import models to load associations
const startServer = async () => {
    try {
        // Test database connection
        await database_1.default.authenticate();
        console.log('✅ Database connected successfully');
        // Create tables if they don't exist
        await database_1.default.sync({ force: false });
        console.log('✅ Database synchronized');
        // Start server
        app_1.default.listen(config_1.config.port, () => {
            logger_1.default.info(`🚀 Server running on port ${config_1.config.port}`);
            logger_1.default.info(`📍 Environment: ${config_1.config.env}`);
        });
    }
    catch (error) {
        logger_1.default.error('❌ Unable to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map