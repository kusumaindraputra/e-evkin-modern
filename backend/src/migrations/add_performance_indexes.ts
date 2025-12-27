/**
 * Migration: Add Performance Indexes
 * Purpose: Improve query performance for frequently accessed columns
 * 
 * Run: npx tsx src/migrations/add_performance_indexes.ts
 */

import { QueryInterface } from 'sequelize';
import { sequelize } from '../config/database';

async function up(queryInterface: QueryInterface): Promise<void> {
  console.log('🚀 Adding performance indexes...');

  // Index for laporan queries filtered by user, month, year
  await queryInterface.addIndex('laporan', ['user_id', 'bulan', 'tahun'], {
    name: 'idx_laporan_user_bulan_tahun',
    concurrently: true,
  });
  console.log('✅ Created idx_laporan_user_bulan_tahun');

  // Index for status filtering (admin verification queries)
  await queryInterface.addIndex('laporan', ['status'], {
    name: 'idx_laporan_status',
  });
  console.log('✅ Created idx_laporan_status');

  // Index for sub_kegiatan joins
  await queryInterface.addIndex('laporan', ['id_sub_kegiatan'], {
    name: 'idx_laporan_id_sub_kegiatan',
  });
  console.log('✅ Created idx_laporan_id_sub_kegiatan');

  // Index for sumber_anggaran joins
  await queryInterface.addIndex('laporan', ['id_sumber_anggaran'], {
    name: 'idx_laporan_id_sumber_anggaran',
  });
  console.log('✅ Created idx_laporan_id_sumber_anggaran');

  // Index for satuan joins
  await queryInterface.addIndex('laporan', ['id_satuan'], {
    name: 'idx_laporan_id_satuan',
  });
  console.log('✅ Created idx_laporan_id_satuan');

  // Composite index for admin reporting queries
  await queryInterface.addIndex('laporan', ['tahun', 'bulan', 'status'], {
    name: 'idx_laporan_reporting',
  });
  console.log('✅ Created idx_laporan_reporting');

  // Index for sub_kegiatan_target queries
  await queryInterface.addIndex('sub_kegiatan_target', ['user_id', 'tahun'], {
    name: 'idx_target_user_tahun',
  });
  console.log('✅ Created idx_target_user_tahun');

  // Index for sub_kegiatan_target by sub_kegiatan
  await queryInterface.addIndex('sub_kegiatan_target', ['id_sub_kegiatan', 'id_sumber_anggaran'], {
    name: 'idx_target_sub_kegiatan_sumber',
  });
  console.log('✅ Created idx_target_sub_kegiatan_sumber');

  console.log('✅ All performance indexes created successfully!');
}

async function down(queryInterface: QueryInterface): Promise<void> {
  console.log('🔄 Removing performance indexes...');

  await queryInterface.removeIndex('laporan', 'idx_laporan_user_bulan_tahun');
  await queryInterface.removeIndex('laporan', 'idx_laporan_status');
  await queryInterface.removeIndex('laporan', 'idx_laporan_id_sub_kegiatan');
  await queryInterface.removeIndex('laporan', 'idx_laporan_id_sumber_anggaran');
  await queryInterface.removeIndex('laporan', 'idx_laporan_id_satuan');
  await queryInterface.removeIndex('laporan', 'idx_laporan_reporting');
  await queryInterface.removeIndex('sub_kegiatan_target', 'idx_target_user_tahun');
  await queryInterface.removeIndex('sub_kegiatan_target', 'idx_target_sub_kegiatan_sumber');

  console.log('✅ All indexes removed');
}

// Run migration if executed directly
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected');

      const queryInterface = sequelize.getQueryInterface();
      await up(queryInterface);

      console.log('✅ Migration completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  })();
}

export { up, down };
