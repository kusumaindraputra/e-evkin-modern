"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/migrations/create_lra_tables.ts
const sequelize_1 = require("sequelize");
exports.default = {
    up: async (queryInterface) => {
        await queryInterface.createTable('lra_upload_batch', {
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            filename: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
            },
            bulan: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: false,
            },
            tahun: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            uploaded_by: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            row_count: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
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
        await queryInterface.createTable('lra_realisasi', {
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            batch_id: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: { model: 'lra_upload_batch', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            user_id: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            id_sub_kegiatan: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'sub_kegiatan', key: 'id_sub_kegiatan' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            id_sumber_anggaran: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'sumber_anggaran', key: 'id_sumber' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            bulan: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: false,
            },
            tahun: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            realisasi_rp: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                defaultValue: 0,
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
        await queryInterface.addIndex('lra_realisasi', {
            fields: ['user_id', 'id_sub_kegiatan', 'id_sumber_anggaran', 'bulan', 'tahun'],
            name: 'lra_realisasi_lookup',
        });
        await queryInterface.addIndex('lra_realisasi', {
            fields: ['batch_id'],
            name: 'lra_realisasi_batch',
        });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('lra_realisasi');
        await queryInterface.dropTable('lra_upload_batch');
    },
};
//# sourceMappingURL=create_lra_tables.js.map