'use strict';

/**
 * Production Schema Validation Migration
 * 
 * This migration ensures all required schema elements are in place for production.
 * It is idempotent - safe to run multiple times.
 * 
 * Validates:
 * - target_angkas column in laporan table
 * - Performance indexes on laporan, anggaran_kas, sub_kegiatan_target
 * - User role index for faster auth queries
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Ensure target_angkas column exists in laporan
      const [laporanColumns] = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'laporan' AND column_name = 'target_angkas'`,
        { transaction }
      );
      
      if (laporanColumns.length === 0) {
        console.log('Adding target_angkas column to laporan table...');
        await queryInterface.addColumn('laporan', 'target_angkas', {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        }, { transaction });
      } else {
        console.log('target_angkas column already exists in laporan table');
      }

      // 2. Ensure performance indexes exist
      const indexChecks = [
        {
          name: 'laporan_user_bulan_tahun',
          table: 'laporan',
          columns: ['user_id', 'bulan', 'tahun'],
        },
        {
          name: 'laporan_status',
          table: 'laporan',
          columns: ['status'],
        },
        {
          name: 'users_role_idx',
          table: 'users',
          columns: ['role'],
        },
        {
          name: 'anggaran_kas_lookup_entry',
          table: 'anggaran_kas',
          columns: ['user_id', 'kode_rekening', 'id_sumber_anggaran', 'tahun', 'bulan'],
        },
        {
          name: 'anggaran_kas_user_tahun',
          table: 'anggaran_kas',
          columns: ['user_id', 'tahun'],
        },
        {
          name: 'anggaran_kas_sub_kegiatan_tahun',
          table: 'anggaran_kas',
          columns: ['id_sub_kegiatan', 'tahun'],
        },
        {
          name: 'sub_kegiatan_target_user_tahun',
          table: 'sub_kegiatan_target',
          columns: ['user_id', 'tahun'],
        },
      ];

      for (const idx of indexChecks) {
        const [existingIndex] = await queryInterface.sequelize.query(
          `SELECT indexname FROM pg_indexes 
           WHERE tablename = '${idx.table}' AND indexname = '${idx.name}'`,
          { transaction }
        );
        
        if (existingIndex.length === 0) {
          // Check if table exists first
          const [tableExists] = await queryInterface.sequelize.query(
            `SELECT table_name FROM information_schema.tables 
             WHERE table_name = '${idx.table}' AND table_schema = 'public'`,
            { transaction }
          );
          
          if (tableExists.length > 0) {
            console.log(`Creating index ${idx.name} on ${idx.table}...`);
            try {
              await queryInterface.addIndex(idx.table, idx.columns, {
                name: idx.name,
                transaction,
              });
            } catch (e) {
              // Index might already exist with different name
              console.log(`  Note: ${e.message}`);
            }
          }
        } else {
          console.log(`Index ${idx.name} already exists on ${idx.table}`);
        }
      }

      await transaction.commit();
      console.log('Production schema validation completed successfully');
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // This is a validation migration - down doesn't remove anything
    // to prevent accidental data loss
    console.log('Production schema validation migration - no rollback action needed');
  }
};
