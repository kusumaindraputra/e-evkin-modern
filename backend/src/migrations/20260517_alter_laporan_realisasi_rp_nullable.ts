import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn('laporan', 'realisasi_rp', {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: null,
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn('laporan', 'realisasi_rp', {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    });
  },
};
