"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
/**
 * Migration to add missing columns to sub_kegiatan_target table
 * Required for proper operation with Excel upload and target management
 */
exports.default = {
    up: async (queryInterface) => {
        const tableInfo = await queryInterface.describeTable('sub_kegiatan_target');
        // Add id_sumber_anggaran if not exists
        if (!tableInfo.id_sumber_anggaran) {
            console.log('Adding id_sumber_anggaran column...');
            await queryInterface.addColumn('sub_kegiatan_target', 'id_sumber_anggaran', {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'sumber_anggaran',
                    key: 'id_sumber',
                },
                onDelete: 'SET NULL',
            });
        }
        // Alter bulan to allow null (for yearly targets)
        console.log('Altering bulan column to allow NULL...');
        await queryInterface.changeColumn('sub_kegiatan_target', 'bulan', {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: true,
        });
        // Alter created_by to allow null
        console.log('Altering created_by column to allow NULL...');
        await queryInterface.changeColumn('sub_kegiatan_target', 'created_by', {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
        });
        // Add unique constraint for user_id + id_sub_kegiatan + id_sumber_anggaran + tahun
        try {
            await queryInterface.addConstraint('sub_kegiatan_target', {
                fields: ['user_id', 'id_sub_kegiatan', 'id_sumber_anggaran', 'tahun'],
                type: 'unique',
                name: 'sub_kegiatan_target_user_id_id_sub_kegiatan_id_sumber_angga_key',
            });
            console.log('✅ Added unique constraint');
        }
        catch (e) {
            if (e.message.includes('already exists')) {
                console.log('Unique constraint already exists, skipping...');
            }
            else {
                console.log('Warning: Could not add unique constraint:', e.message);
            }
        }
        console.log('✅ Migration completed: add_sumber_anggaran_to_target');
    },
    down: async (queryInterface) => {
        try {
            await queryInterface.removeConstraint('sub_kegiatan_target', 'sub_kegiatan_target_user_id_id_sub_kegiatan_id_sumber_angga_key');
        }
        catch (e) {
            // Ignore if constraint doesn't exist
        }
        await queryInterface.removeColumn('sub_kegiatan_target', 'id_sumber_anggaran');
    },
};
//# sourceMappingURL=add_sumber_anggaran_to_target.js.map