"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class SubKegiatanSumberAnggaran extends sequelize_1.Model {
}
SubKegiatanSumberAnggaran.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_sub_kegiatan: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'sub_kegiatan',
            key: 'id_sub_kegiatan',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    id_sumber_anggaran: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'sumber_anggaran',
            key: 'id_sumber',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    is_active: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize: database_1.default,
    tableName: 'sub_kegiatan_sumber_dana',
    timestamps: true,
    underscored: false, // Use camelCase for createdAt/updatedAt
    indexes: [
        {
            unique: true,
            fields: ['id_sub_kegiatan', 'id_sumber_anggaran'],
            name: 'unique_sub_kegiatan_sumber',
        },
        {
            fields: ['id_sub_kegiatan'],
        },
        {
            fields: ['id_sumber_anggaran'],
        },
    ],
});
exports.default = SubKegiatanSumberAnggaran;
//# sourceMappingURL=SubKegiatanSumberAnggaran.js.map