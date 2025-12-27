import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Add catatan column for change notes/history
    await queryInterface.addColumn('sub_kegiatan_target', 'catatan', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Catatan perubahan - mencatat sumber/alasan perubahan data',
    });

    console.log('✅ Added catatan column to sub_kegiatan_target table');

    // Fix any null timestamps
    await queryInterface.sequelize.query(`
      UPDATE sub_kegiatan_target 
      SET created_at = NOW() 
      WHERE created_at IS NULL
    `);

    await queryInterface.sequelize.query(`
      UPDATE sub_kegiatan_target 
      SET updated_at = NOW() 
      WHERE updated_at IS NULL
    `);

    console.log('✅ Fixed null timestamps in sub_kegiatan_target table');
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('sub_kegiatan_target', 'catatan');
  },
};
