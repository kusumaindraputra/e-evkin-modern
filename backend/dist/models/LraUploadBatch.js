"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/models/LraUploadBatch.ts
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class LraUploadBatch extends sequelize_1.Model {
}
LraUploadBatch.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    filename: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    bulan: { type: sequelize_1.DataTypes.STRING(20), allowNull: false },
    tahun: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    uploaded_by: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
    },
    row_count: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
    sequelize: database_1.default,
    tableName: 'lra_upload_batch',
    underscored: true,
    timestamps: true,
});
exports.default = LraUploadBatch;
//# sourceMappingURL=LraUploadBatch.js.map