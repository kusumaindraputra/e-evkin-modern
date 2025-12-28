"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = __importDefault(require("./User"));
class PuskesmasEditPermission extends sequelize_1.Model {
}
PuskesmasEditPermission.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
    },
    scope: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    bulan: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
    },
    tahun: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    enabled: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    start_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    end_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    created_by: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
    },
}, {
    sequelize: database_1.default,
    tableName: 'puskesmas_edit_permission',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['user_id', 'scope', 'bulan', 'tahun'] },
        { fields: ['created_at'] },
    ],
});
PuskesmasEditPermission.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'puskesmas' });
PuskesmasEditPermission.belongsTo(User_1.default, { foreignKey: 'created_by', as: 'creator' });
exports.default = PuskesmasEditPermission;
//# sourceMappingURL=PuskesmasEditPermission.js.map