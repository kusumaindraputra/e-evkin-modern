/**
 * Migration: Add Performance Indexes for Optimization
 * Purpose: Add composite indexes for frequently queried columns
 * 
 * Run: npx tsx src/migrations/add_optimization_indexes.ts
 */

import { QueryInterface } from 'sequelize';
import { sequelize } from '../config/database';

async function up(queryInterface: QueryInterface): Promise<void> {
  console.log('🔧 Adding performance optimization indexes...');

  // Helper function to safely add index
  const addIndexIfNotExists = async (
    table: string, 
    columns: string[], 
    options: any
  ) => {
    try {
      await queryInterface.addIndex(table, columns, options);
      console.log(`✅ Added index: ${options.name}`);
    } catch (error: any) {
      if (error.original?.code === '42P07') { // Index already exists
        console.log(`⏭️  Index ${options.name} already exists, skipping...`);
      } else {
        throw error; // Re-throw other errors
      }
    }
  };

  // 1. Laporan - Frequent query: user_id + bulan + tahun
  await addIndexIfNotExists('laporan', ['user_id', 'bulan', 'tahun'], {
    name: 'idx_laporan_user_bulan_tahun',
    concurrently: true, // PostgreSQL only - prevents table lock
  });

  // 2. Laporan - Filter by status
  await addIndexIfNotExists('laporan', ['status'], {
    name: 'idx_laporan_status',
    concurrently: true,
  });

  // 3. SubKegiatanTarget - Frequent lookup by user + sub_kegiatan + sumber + tahun
  await addIndexIfNotExists('sub_kegiatan_target', 
    ['user_id', 'id_sub_kegiatan', 'id_sumber_anggaran', 'tahun'], {
    name: 'idx_target_user_subkeg_sumber_tahun',
    concurrently: true,
  });

  // 4. AnggaranKas - Lookup by user + sub_kegiatan + bulan + tahun
  await addIndexIfNotExists('anggaran_kas', 
    ['user_id', 'id_sub_kegiatan', 'bulan', 'tahun'], {
    name: 'idx_angkas_user_subkeg_bulan_tahun',
    concurrently: true,
  });

  // 5. AnggaranKas - Lookup by kode_rekening (for matching)
  await addIndexIfNotExists('anggaran_kas', ['kode_rekening'], {
    name: 'idx_angkas_kode_rekening',
    concurrently: true,
  });

  // 6. SubKegiatan - Lookup by kode_sub (used in Excel upload)
  await addIndexIfNotExists('sub_kegiatan', ['kode_sub'], {
    name: 'idx_sub_kegiatan_kode_sub',
    unique: true, // Ensure uniqueness
  });

  // 7. User - Lookup by nama (case-insensitive for puskesmas matching)
  await addIndexIfNotExists('users', ['nama'], {
    name: 'idx_users_nama',
  });

  // 8. User - Lookup by role (frequently filtered)
  await addIndexIfNotExists('users', ['role'], {
    name: 'idx_users_role',
  });

  console.log('✅ All optimization indexes added successfully!');
}

async function down(queryInterface: QueryInterface): Promise<void> {
  console.log('🔧 Removing optimization indexes...');

  await queryInterface.removeIndex('laporan', 'idx_laporan_user_bulan_tahun');
  await queryInterface.removeIndex('laporan', 'idx_laporan_status');
  await queryInterface.removeIndex('sub_kegiatan_target', 'idx_target_user_subkeg_sumber_tahun');
  await queryInterface.removeIndex('anggaran_kas', 'idx_angkas_user_subkeg_bulan_tahun');
  await queryInterface.removeIndex('anggaran_kas', 'idx_angkas_kode_rekening');
  await queryInterface.removeIndex('sub_kegiatan', 'idx_sub_kegiatan_kode_sub');
  await queryInterface.removeIndex('users', 'idx_users_nama');
  await queryInterface.removeIndex('users', 'idx_users_role');

  console.log('✅ All optimization indexes removed');
}

// Run migration if executed directly
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected');

      const queryInterface = sequelize.getQueryInterface();
      await up(queryInterface);

      console.log('\n✅ Migration completed successfully!');
      console.log('📊 These indexes will significantly improve query performance.');
      process.exit(0);
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  })();
}

export { up, down };
