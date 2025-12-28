import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable('anggaran_kas', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    id_sub_kegiatan: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'sub_kegiatan',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    id_sumber_anggaran: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sumber_anggaran',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    kode_rekening: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Kode rekening from PDF (e.g., 1.02.02.2.02.0033)',
    },
    uraian: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Description from PDF for matching to sub_kegiatan',
    },
    tahun: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bulan: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nilai: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Monthly budget allocation in Rupiah',
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
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

  // Create unique constraint for entry
  await queryInterface.addIndex('anggaran_kas', {
    fields: ['user_id', 'kode_rekening', 'id_sumber_anggaran', 'tahun', 'bulan'],
    unique: true,
    name: 'anggaran_kas_unique_entry',
  });

  // Create index for user + tahun queries
  await queryInterface.addIndex('anggaran_kas', {
    fields: ['user_id', 'tahun'],
    name: 'anggaran_kas_user_tahun',
  });

  // Create index for sub_kegiatan + tahun queries
  await queryInterface.addIndex('anggaran_kas', {
    fields: ['id_sub_kegiatan', 'tahun'],
    name: 'anggaran_kas_sub_kegiatan_tahun',
  });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('anggaran_kas');
  },
};
