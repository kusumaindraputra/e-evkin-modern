import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable('sub_kegiatan_target', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      id_sub_kegiatan: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'sub_kegiatan',
          key: 'id_sub_kegiatan',
        },
        onDelete: 'CASCADE',
      },
      target_k: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      target_rp: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      bulan: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      tahun: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
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

    // Create indexes
    await queryInterface.addIndex('sub_kegiatan_target', ['user_id', 'id_sub_kegiatan', 'bulan', 'tahun'], {
      name: 'idx_sub_kegiatan_target_lookup',
    });

    await queryInterface.addIndex('sub_kegiatan_target', ['user_id'], {
      name: 'idx_sub_kegiatan_target_user',
    });

    await queryInterface.addIndex('sub_kegiatan_target', ['id_sub_kegiatan'], {
      name: 'idx_sub_kegiatan_target_sub_kegiatan',
    });

    await queryInterface.addIndex('sub_kegiatan_target', ['created_at'], {
      name: 'idx_sub_kegiatan_target_created_at',
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('sub_kegiatan_target');
  },
};
