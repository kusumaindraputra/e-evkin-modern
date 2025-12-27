"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = __importDefault(require("./User"));
const SubKegiatan_1 = __importDefault(require("./SubKegiatan"));
class PuskesmasSubKegiatan extends sequelize_1.Model {
}
PuskesmasSubKegiatan.init({
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
}, {
    sequelize: database_1.default,
    tableName: 'puskesmas_sub_kegiatan',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'id_sub_kegiatan'],
        },
    ],
});
// Define associations
PuskesmasSubKegiatan.belongsTo(User_1.default, {
    foreignKey: 'user_id',
    as: 'puskesmas',
});
PuskesmasSubKegiatan.belongsTo(SubKegiatan_1.default, {
    foreignKey: 'id_sub_kegiatan',
    as: 'subKegiatan',
});
// Many-to-many relationships
User_1.default.belongsToMany(SubKegiatan_1.default, {
    through: PuskesmasSubKegiatan,
    foreignKey: 'user_id',
    otherKey: 'id_sub_kegiatan',
    as: 'assignedSubKegiatan',
});
SubKegiatan_1.default.belongsToMany(User_1.default, {
    through: PuskesmasSubKegiatan,
    foreignKey: 'id_sub_kegiatan',
    otherKey: 'user_id',
    as: 'assignedPuskesmas',
});
exports.default = PuskesmasSubKegiatan;
//# sourceMappingURL=PuskesmasSubKegiatan.js.map