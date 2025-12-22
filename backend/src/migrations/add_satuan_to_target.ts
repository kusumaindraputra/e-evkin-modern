import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.addColumn('sub_kegiatan_target', 'id_satuan', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'satuan',
      key: 'id_satuan',
    },
    onDelete: 'SET NULL',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.removeColumn('sub_kegiatan_target', 'id_satuan');
};
