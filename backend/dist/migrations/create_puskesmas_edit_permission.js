"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const sequelize_1 = require("sequelize");
const up = async (queryInterface) => {
    await queryInterface.createTable('puskesmas_edit_permission', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        user_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
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
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        updated_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    });
    await queryInterface.addIndex('puskesmas_edit_permission', ['user_id', 'scope', 'bulan', 'tahun']);
    await queryInterface.addIndex('puskesmas_edit_permission', ['created_at']);
};
exports.up = up;
const down = async (queryInterface) => {
    await queryInterface.dropTable('puskesmas_edit_permission');
};
exports.down = down;
//# sourceMappingURL=create_puskesmas_edit_permission.js.map