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
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
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
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.config.corsOrigin,
    credentials: true
}));
app.use(rateLimiter_1.rateLimiter);
// Body parsing middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, compression_1.default)());
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
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
// Error handling
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map