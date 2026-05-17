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
        // Start server
        const server = app_1.default.listen(config_1.config.port, () => {
            logger_1.default.info(`🚀 Server running on port ${config_1.config.port}`);
            logger_1.default.info(`📍 Environment: ${config_1.config.env}`);
            // Signal PM2 that the app is ready (for graceful reload)
            if (typeof process.send === 'function') {
                process.send('ready');
            }
        });
        // Graceful shutdown handler
        const gracefulShutdown = (signal) => {
            logger_1.default.info(`${signal} received. Starting graceful shutdown...`);
            // Stop accepting new connections
            server.close(async () => {
                logger_1.default.info('HTTP server closed.');
                try {
                    // Close database connections
                    await database_1.default.close();
                    logger_1.default.info('Database connections closed.');
                }
                catch (err) {
                    logger_1.default.error('Error closing database:', err);
                }
                process.exit(0);
            });
            // Force shutdown after 10s if graceful shutdown fails
            setTimeout(() => {
                logger_1.default.error('Graceful shutdown timed out. Forcing exit.');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        // Handle uncaught exceptions and unhandled rejections
        process.on('uncaughtException', (error) => {
            logger_1.default.error('Uncaught Exception:', error);
            gracefulShutdown('uncaughtException');
        });
        process.on('unhandledRejection', (reason) => {
            logger_1.default.error('Unhandled Rejection:', reason);
        });
    }
    catch (error) {
        logger_1.default.error('❌ Unable to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map