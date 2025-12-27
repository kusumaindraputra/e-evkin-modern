"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class SumberAnggaran extends sequelize_1.Model {
}
SumberAnggaran.init({
    id_sumber: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    sumber: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    tableName: 'sumber_anggaran',
    timestamps: true,
});
exports.default = SumberAnggaran;
//# sourceMappingURL=SumberAnggaran.js.map