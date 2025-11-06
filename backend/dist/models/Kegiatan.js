"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Kegiatan extends sequelize_1.Model {
}
Kegiatan.init({
    id_kegiatan: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_uraian: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    kode: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    kegiatan: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    tableName: 'kegiatan',
    timestamps: true,
});
exports.default = Kegiatan;
//# sourceMappingURL=Kegiatan.js.map