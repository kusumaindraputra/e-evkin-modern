import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface LaporanAttributes {
  id: string;
  user_id: string;
  id_kegiatan: number;
  id_sub_kegiatan: number;
  id_sumber_anggaran: number;
  id_satuan: number;
  target_k: number;
  angkas: number;
  target_rp: number;
  realisasi_k: number;
  realisasi_rp: number;
  permasalahan: string;
  upaya: string;
  bulan: string;
  tahun: number;
  status?: 'menunggu' | 'terkirim' | 'diverifikasi' | 'ditolak';
  catatan?: string;
  verified_by?: string;
  verified_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface LaporanCreationAttributes 
  extends Optional<LaporanAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> {}

class Laporan extends Model<LaporanAttributes, LaporanCreationAttributes> implements LaporanAttributes {
  declare id: string;
  declare user_id: string;
  declare id_kegiatan: number;
  declare id_sub_kegiatan: number;
  declare id_sumber_anggaran: number;
  declare id_satuan: number;
  declare target_k: number;
  declare angkas: number;
  declare target_rp: number;
  declare realisasi_k: number;
  declare realisasi_rp: number;
  declare permasalahan: string;
  declare upaya: string;
  declare bulan: string;
  declare tahun: number;
  declare status?: 'menunggu' | 'terkirim' | 'diverifikasi' | 'ditolak';
  declare catatan?: string;
  declare verified_by?: string;
  declare verified_at?: Date;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Laporan.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
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
    bulan: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']],
      },
    },
    tahun: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_kegiatan: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_sub_kegiatan: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    id_satuan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'satuan',
        key: 'id_satuan',
      },
    },
    target_k: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    angkas: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    target_rp: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    realisasi_k: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    realisasi_rp: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    permasalahan: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    upaya: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('menunggu', 'terkirim', 'diverifikasi', 'ditolak'),
      allowNull: false,
      defaultValue: 'menunggu',
    },
    catatan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    verified_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'laporan',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['bulan', 'tahun'],
      },
    ],
  }
);

export default Laporan;
