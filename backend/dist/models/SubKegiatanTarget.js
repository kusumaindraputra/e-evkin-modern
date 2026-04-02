"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = __importDefault(require("./User"));
const SubKegiatan_1 = __importDefault(require("./SubKegiatan"));
const SumberAnggaran_1 = __importDefault(require("./SumberAnggaran"));
const Satuan_1 = __importDefault(require("./Satuan"));
class SubKegiatanTarget extends sequelize_1.Model {
}
SubKegiatanTarget.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    id_sub_kegiatan: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'sub_kegiatan',
            key: 'id_sub_kegiatan',
        },
        onDelete: 'CASCADE',
    },
    id_sumber_anggaran: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'sumber_anggaran',
            key: 'id_sumber',
        },
        onDelete: 'CASCADE',
    },
    id_satuan: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'satuan',
            key: 'id_satuan',
        },
        onDelete: 'SET NULL',
    },
    target_k: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    target_rp: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
    },
    bulan: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true, // Now allows null for yearly targets
    },
    tahun: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    catatan: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    bulan_penetapan: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        comment: 'Bulan penetapan (1-12), null = berlaku dari awal tahun',
    },
    tanggal_penetapan: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Tanggal resmi penetapan anggaran',
    },
    created_by: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
}, {
    sequelize: database_1.default,
    tableName: 'sub_kegiatan_target',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            name: 'skt_lookup_idx',
            fields: ['user_id', 'id_sub_kegiatan', 'id_sumber_anggaran', 'bulan', 'tahun'],
        },
        {
            fields: ['user_id'],
        },
        {
            fields: ['id_sub_kegiatan'],
        },
        {
            fields: ['id_sumber_anggaran'],
        },
        {
            fields: ['created_at'],
        },
    ],
});
// Define associations
SubKegiatanTarget.belongsTo(User_1.default, {
    foreignKey: 'user_id',
    as: 'puskesmas',
});
SubKegiatanTarget.belongsTo(SubKegiatan_1.default, {
    foreignKey: 'id_sub_kegiatan',
    as: 'subKegiatan',
});
SubKegiatanTarget.belongsTo(SumberAnggaran_1.default, {
    foreignKey: 'id_sumber_anggaran',
    as: 'sumberAnggaran',
});
SubKegiatanTarget.belongsTo(Satuan_1.default, {
    foreignKey: 'id_satuan',
    as: 'satuan',
});
SubKegiatanTarget.belongsTo(User_1.default, {
    foreignKey: 'created_by',
    as: 'creator',
});
exports.default = SubKegiatanTarget;
//# sourceMappingURL=SubKegiatanTarget.js.map