"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeAdmin = void 0;
const authorizeAdmin = (req, res, next) => {
    // @ts-ignore - req.user populated by authenticate middleware
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    return next();
};
exports.authorizeAdmin = authorizeAdmin;
//# sourceMappingURL=authorize.js.map