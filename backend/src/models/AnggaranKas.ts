import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Interface for AnggaranKas attributes
interface AnggaranKasAttributes {
  id: number;
  user_id: string; // UUID - puskesmas user
  id_sub_kegiatan: number | null; // Can be null if no mapping found
  id_sumber_anggaran: number;
  kode_rekening: string; // Original code from PDF
  uraian: string; // Description from PDF for matching
  tahun: number;
  bulan: number; // 1-12
  nilai: number; // Monthly value in Rupiah
  created_by: string | null; // UUID - admin who uploaded
  created_at?: Date;
  updated_at?: Date;
}

// Interface for creation (id is auto-generated)
interface AnggaranKasCreationAttributes extends Optional<AnggaranKasAttributes, 'id' | 'created_at' | 'updated_at'> {}

// AnggaranKas Model class
class AnggaranKas extends Model<AnggaranKasAttributes, AnggaranKasCreationAttributes> implements AnggaranKasAttributes {
  public id!: number;
  public user_id!: string;
  public id_sub_kegiatan!: number | null;
  public id_sumber_anggaran!: number;
  public kode_rekening!: string;
  public uraian!: string;
  public tahun!: number;
  public bulan!: number;
  public nilai!: number;
  public created_by!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// Initialize the model
AnggaranKas.init(
  {
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
    },
    id_sub_kegiatan: {
      type: DataTypes.INTEGER,
      allowNull: true, // Can be null if no mapping found
      references: {
        model: 'sub_kegiatan',
        key: 'id_sub_kegiatan',
      },
    },
    id_sumber_anggaran: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sumber_anggaran',
        key: 'id_sumber',
      },
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
      validate: {
        min: 1,
        max: 12,
      },
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
    },
  },
  {
    sequelize,
    tableName: 'anggaran_kas',
    timestamps: true,
    underscored: true,
    indexes: [
      // No unique constraint - allow multiple records for history tracking
      {
        fields: ['user_id', 'kode_rekening', 'id_sumber_anggaran', 'tahun', 'bulan'],
        name: 'anggaran_kas_lookup_entry',
      },
      {
        fields: ['user_id', 'tahun'],
        name: 'anggaran_kas_user_tahun',
      },
      {
        fields: ['id_sub_kegiatan', 'tahun'],
        name: 'anggaran_kas_sub_kegiatan_tahun',
      },
      {
        fields: ['created_at'],
        name: 'anggaran_kas_created_at',
      },
    ],
  }
);

// Associations will be set up in index.ts
export default AnggaranKas;
