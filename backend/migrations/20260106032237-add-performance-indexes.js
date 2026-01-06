'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add missing performance indexes
    
    // SubKegiatan - kode_sub used in search/lookups
    await queryInterface.addIndex('sub_kegiatan', ['kode_sub'], {
      name: 'sub_kegiatan_kode_sub_idx',
      unique: false,
    });

    // Users - kode_sub_unit used in puskesmas lookups
    await queryInterface.addIndex('users', ['kode_sub_unit'], {
      name: 'users_kode_sub_unit_idx',
      unique: false,
    });

    // Laporan - id_kegiatan used in filters
    await queryInterface.addIndex('laporan', ['id_kegiatan'], {
      name: 'laporan_id_kegiatan_idx',
      unique: false,
    });

    // Laporan - id_satuan used in grouping
    await queryInterface.addIndex('laporan', ['id_satuan'], {
      name: 'laporan_id_satuan_idx',
      unique: false,
    });

    // Laporan - composite index for common queries (user + bulan + tahun + status)
    await queryInterface.addIndex('laporan', ['user_id', 'bulan', 'tahun', 'status'], {
      name: 'laporan_user_period_status_idx',
      unique: false,
    });

    // SubKegiatanTarget - composite index for target lookups
    await queryInterface.addIndex('sub_kegiatan_target', ['user_id', 'id_sub_kegiatan', 'tahun'], {
      name: 'sub_kegiatan_target_user_sub_tahun_idx',
      unique: false,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('sub_kegiatan', 'sub_kegiatan_kode_sub_idx');
    await queryInterface.removeIndex('users', 'users_kode_sub_unit_idx');
    await queryInterface.removeIndex('laporan', 'laporan_id_kegiatan_idx');
    await queryInterface.removeIndex('laporan', 'laporan_id_satuan_idx');
    await queryInterface.removeIndex('laporan', 'laporan_user_period_status_idx');
    await queryInterface.removeIndex('sub_kegiatan_target', 'sub_kegiatan_target_user_sub_tahun_idx');
  }
};
