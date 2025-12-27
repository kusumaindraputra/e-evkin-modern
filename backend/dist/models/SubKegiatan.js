"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const Kegiatan_1 = __importDefault(require("./Kegiatan"));
class SubKegiatan extends sequelize_1.Model {
}
SubKegiatan.init({
    id_sub_kegiatan: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_kegiatan: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'kegiatan',
            key: 'id_kegiatan',
        },
    },
    kode_sub: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
    kegiatan: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
    indikator_kinerja: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    tableName: 'sub_kegiatan',
    timestamps: true,
});
// Define relation
SubKegiatan.belongsTo(Kegiatan_1.default, {
    foreignKey: 'id_kegiatan',
    as: 'kegiatanParent',
});
Kegiatan_1.default.hasMany(SubKegiatan, {
    foreignKey: 'id_kegiatan',
    as: 'subKegiatan',
});
exports.default = SubKegiatan;
//# sourceMappingURL=SubKegiatan.js.map