'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add target_angkas column for manual input when sub_kegiatan has multiple sumber_anggaran
    // This stores the user-entered target angkas value (null means use PDF auto-fill)
    await queryInterface.addColumn('laporan', 'target_angkas', {
      type: Sequelize.BIGINT,
      allowNull: true, // null = auto from PDF, value = manual input
      defaultValue: null,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('laporan', 'target_angkas');
  }
};
