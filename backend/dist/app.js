"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
require("express-async-errors");
const config_1 = require("./config");
const swagger_1 = require("./config/swagger");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const database_1 = __importDefault(require("./config/database"));
const cacheService_1 = require("./services/cacheService");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const puskesmas_routes_1 = __importDefault(require("./routes/puskesmas.routes"));
const laporan_routes_1 = __importDefault(require("./routes/laporan.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const reference_routes_1 = __importDefault(require("./routes/reference.routes"));
const export_routes_1 = __importDefault(require("./routes/export.routes"));
const masterdata_routes_1 = __importDefault(require("./routes/masterdata.routes"));
const kegiatan_routes_1 = __importDefault(require("./routes/kegiatan.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const puskesmas_config_routes_1 = __importDefault(require("./routes/puskesmas-config.routes"));
const sub_kegiatan_sumber_anggaran_routes_1 = __importDefault(require("./routes/sub-kegiatan-sumber-anggaran.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const target_routes_1 = __importDefault(require("./routes/target.routes"));
const target_upload_routes_1 = __importDefault(require("./routes/target-upload.routes"));
const angkas_routes_1 = __importDefault(require("./routes/angkas.routes"));
const app = (0, express_1.default)();
// Trust proxy (behind nginx)
app.set('trust proxy', 1);
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.config.corsOrigin,
    credentials: true
}));
app.use(rateLimiter_1.rateLimiter);
// Body parsing middleware with size limits
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
app.use((0, compression_1.default)());
// Swagger API Documentation
(0, swagger_1.setupSwagger)(app);
// Health check with optional diagnostics (detail only from localhost/internal)
app.get('/health', async (req, res) => {
    const basic = { status: 'OK', timestamp: new Date().toISOString() };
    if (req.query.detail === 'true') {
        const clientIp = req.ip || req.socket.remoteAddress || '';
        const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1';
        if (!isLocal) {
            res.json(basic);
            return;
        }
        let poolStats = null;
        try {
            const pool = database_1.default.connectionManager?.pool;
            if (pool) {
                poolStats = {
                    size: pool.size ?? pool._count ?? null,
                    available: pool.available ?? pool._availableObjectsCount?.() ?? null,
                    using: pool.using ?? pool._inUseObjectsCount?.() ?? null,
                    waiting: pool.waiting ?? pool._waitingClientsCount?.() ?? null,
                };
            }
        }
        catch { /* pool introspection failed — ignore */ }
        res.json({
            ...basic,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            dbPool: poolStats,
            cache: cacheService_1.cacheService.stats(),
        });
        return;
    }
    res.json(basic);
});
// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'E-EVKIN API Microservice is running',
        version: '1.0.0',
        docs: '/api-docs'
    });
});
// API routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/puskesmas', puskesmas_routes_1.default);
app.use('/api/laporan', laporan_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/reference', reference_routes_1.default);
app.use('/api/export', export_routes_1.default);
app.use('/api/masterdata', masterdata_routes_1.default);
app.use('/api/kegiatan', kegiatan_routes_1.default);
app.use('/api/users', users_routes_1.default);
app.use('/api/report', report_routes_1.default);
app.use('/api/puskesmas-config', puskesmas_config_routes_1.default);
app.use('/api/sub-kegiatan-sumber-anggaran', sub_kegiatan_sumber_anggaran_routes_1.default);
app.use('/api/admin', chat_routes_1.default);
app.use('/api/target', target_routes_1.default);
app.use('/api/target', target_upload_routes_1.default);
app.use('/api/angkas', angkas_routes_1.default);
// 404 handler for unmatched routes
app.use(errorHandler_1.notFoundHandler);
// Error handling
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map