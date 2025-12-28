import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.changeColumn('puskesmas_edit_permission', 'user_id', {
    type: DataTypes.UUID,
    allowNull: true,
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.changeColumn('puskesmas_edit_permission', 'user_id', {
    type: DataTypes.UUID,
    allowNull: false,
  });
};
