"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
// AnggaranKas Model class
class AnggaranKas extends sequelize_1.Model {
    id;
    user_id;
    id_sub_kegiatan;
    id_sumber_anggaran;
    kode_rekening;
    uraian;
    tahun;
    bulan;
    nilai;
    created_by;
    created_at;
    updated_at;
}
// Initialize the model
AnggaranKas.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    id_sub_kegiatan: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true, // Can be null if no mapping found
        references: {
            model: 'sub_kegiatan',
            key: 'id_sub_kegiatan',
        },
    },
    id_sumber_anggaran: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'sumber_anggaran',
            key: 'id_sumber',
        },
    },
    kode_rekening: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        comment: 'Kode rekening from PDF (e.g., 1.02.02.2.02.0033)',
    },
    uraian: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
        comment: 'Description from PDF for matching to sub_kegiatan',
    },
    tahun: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    bulan: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 12,
        },
    },
    nilai: {
        type: sequelize_1.DataTypes.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Monthly budget allocation in Rupiah',
    },
    created_by: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
}, {
    sequelize: database_1.default,
    tableName: 'anggaran_kas',
    timestamps: true,
    underscored: true,
    indexes: [
        // No unique constraint - allow multiple records for history tracking
        {
            fields: ['user_id', 'kode_rekening', 'id_sumber_anggaran', 'tahun', 'bulan'],
            name: 'anggaran_kas_lookup_entry',
        },
        {
            fields: ['user_id', 'tahun'],
            name: 'anggaran_kas_user_tahun',
        },
        {
            fields: ['id_sub_kegiatan', 'tahun'],
            name: 'anggaran_kas_sub_kegiatan_tahun',
        },
        {
            fields: ['created_at'],
            name: 'anggaran_kas_created_at',
        },
    ],
});
// Associations will be set up in index.ts
exports.default = AnggaranKas;
//# sourceMappingURL=AnggaranKas.js.map