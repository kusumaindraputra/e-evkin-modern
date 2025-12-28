import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('puskesmas_edit_permission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    scope: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    bulan: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    tahun: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    start_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex('puskesmas_edit_permission', ['user_id', 'scope', 'bulan', 'tahun']);
  await queryInterface.addIndex('puskesmas_edit_permission', ['created_at']);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('puskesmas_edit_permission');
};
