"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = {
    up: async (queryInterface) => {
        await queryInterface.createTable('sub_kegiatan_target', {
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
                allowNull: false,
            },
            tahun: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            created_by: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
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
        // Create indexes
        await queryInterface.addIndex('sub_kegiatan_target', ['user_id', 'id_sub_kegiatan', 'bulan', 'tahun'], {
            name: 'idx_sub_kegiatan_target_lookup',
        });
        await queryInterface.addIndex('sub_kegiatan_target', ['user_id'], {
            name: 'idx_sub_kegiatan_target_user',
        });
        await queryInterface.addIndex('sub_kegiatan_target', ['id_sub_kegiatan'], {
            name: 'idx_sub_kegiatan_target_sub_kegiatan',
        });
        await queryInterface.addIndex('sub_kegiatan_target', ['created_at'], {
            name: 'idx_sub_kegiatan_target_created_at',
        });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('sub_kegiatan_target');
    },
};
//# sourceMappingURL=create_sub_kegiatan_target.js.map