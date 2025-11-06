"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Laporan extends sequelize_1.Model {
}
Laporan.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
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
    bulan: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: [['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']],
        },
    },
    tahun: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    id_kegiatan: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    id_sub_kegiatan: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
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
    id_satuan: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'satuan',
            key: 'id_satuan',
        },
    },
    target_k: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    angkas: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    target_rp: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    realisasi_k: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    realisasi_rp: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    permasalahan: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    upaya: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('menunggu', 'terkirim', 'diverifikasi', 'ditolak'),
        allowNull: false,
        defaultValue: 'menunggu',
    },
    catatan: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    verified_by: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    verified_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'laporan',
    underscored: true,
    timestamps: true,
    indexes: [
        {
            fields: ['user_id'],
        },
        {
            fields: ['status'],
        },
        {
            fields: ['bulan', 'tahun'],
        },
    ],
});
exports.default = Laporan;
//# sourceMappingURL=Laporan.js.map