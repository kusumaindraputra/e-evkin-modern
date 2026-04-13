// backend/src/migrations/create_lra_tables.ts
import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable('lra_upload_batch', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      bulan: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      tahun: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      uploaded_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      row_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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

    await queryInterface.createTable('lra_realisasi', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      batch_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'lra_upload_batch', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_sub_kegiatan: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'sub_kegiatan', key: 'id_sub_kegiatan' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_sumber_anggaran: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'sumber_anggaran', key: 'id_sumber' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      bulan: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      tahun: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      realisasi_rp: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
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

    await queryInterface.addIndex('lra_realisasi', {
      fields: ['user_id', 'id_sub_kegiatan', 'id_sumber_anggaran', 'bulan', 'tahun'],
      name: 'lra_realisasi_lookup',
    });

    await queryInterface.addIndex('lra_realisasi', {
      fields: ['batch_id'],
      name: 'lra_realisasi_batch',
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('lra_realisasi');
    await queryInterface.dropTable('lra_upload_batch');
  },
};
