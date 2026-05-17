"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/models/LraRealisasi.ts
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class LraRealisasi extends sequelize_1.Model {
}
LraRealisasi.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    batch_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: 'lra_upload_batch', key: 'id' },
    },
    user_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
    },
    id_sub_kegiatan: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'sub_kegiatan', key: 'id_sub_kegiatan' },
    },
    id_sumber_anggaran: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'sumber_anggaran', key: 'id_sumber' },
    },
    bulan: { type: sequelize_1.DataTypes.STRING(20), allowNull: false },
    tahun: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    realisasi_rp: { type: sequelize_1.DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
}, {
    sequelize: database_1.default,
    tableName: 'lra_realisasi',
    underscored: true,
    timestamps: true,
});
exports.default = LraRealisasi;
//# sourceMappingURL=LraRealisasi.js.map