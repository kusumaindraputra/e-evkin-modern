import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn('laporan', 'realisasi_rp', {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: null,
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn('laporan', 'realisasi_rp', {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    });
  },
};
