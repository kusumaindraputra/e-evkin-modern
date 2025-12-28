"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = {
    up: async (queryInterface) => {
        await queryInterface.createTable('anggaran_kas', {
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            user_id: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            id_sub_kegiatan: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'sub_kegiatan',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            id_sumber_anggaran: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'sumber_anggaran',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            kode_rekening: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false,
                comment: 'Kode rekening from PDF (e.g., 1.02.02.2.02.0033)',
            },
            uraian: {
                type: sequelize_1.DataTypes.STRING(500),
                allowNull: false,
                comment: 'Description from PDF for matching to sub_kegiatan',
            },
            tahun: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            bulan: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            nilai: {
                type: sequelize_1.DataTypes.DECIMAL(18, 2),
                allowNull: false,
                defaultValue: 0,
                comment: 'Monthly budget allocation in Rupiah',
            },
            created_by: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
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
        // Create unique constraint for entry
        await queryInterface.addIndex('anggaran_kas', {
            fields: ['user_id', 'kode_rekening', 'id_sumber_anggaran', 'tahun', 'bulan'],
            unique: true,
            name: 'anggaran_kas_unique_entry',
        });
        // Create index for user + tahun queries
        await queryInterface.addIndex('anggaran_kas', {
            fields: ['user_id', 'tahun'],
            name: 'anggaran_kas_user_tahun',
        });
        // Create index for sub_kegiatan + tahun queries
        await queryInterface.addIndex('anggaran_kas', {
            fields: ['id_sub_kegiatan', 'tahun'],
            name: 'anggaran_kas_sub_kegiatan_tahun',
        });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('anggaran_kas');
    },
};
//# sourceMappingURL=create_anggaran_kas.js.map