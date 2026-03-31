import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn('sub_kegiatan_target', 'bulan_penetapan', {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Bulan penetapan (1-12), null = berlaku dari awal tahun',
    });

    console.log('✅ Added bulan_penetapan column to sub_kegiatan_target table');
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('sub_kegiatan_target', 'bulan_penetapan');
  },
};
