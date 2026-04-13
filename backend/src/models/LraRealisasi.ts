// backend/src/models/LraRealisasi.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface LraRealisasiAttributes {
  id: number;
  batch_id: string;
  user_id: string;
  id_sub_kegiatan: number;
  id_sumber_anggaran: number;
  bulan: string;
  tahun: number;
  realisasi_rp: number;
  created_at?: Date;
  updated_at?: Date;
}

interface LraRealisasiCreationAttributes
  extends Optional<LraRealisasiAttributes, 'id' | 'created_at' | 'updated_at'> {}

class LraRealisasi
  extends Model<LraRealisasiAttributes, LraRealisasiCreationAttributes>
  implements LraRealisasiAttributes {
  public id!: number;
  public batch_id!: string;
  public user_id!: string;
  public id_sub_kegiatan!: number;
  public id_sumber_anggaran!: number;
  public bulan!: string;
  public tahun!: number;
  public realisasi_rp!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

LraRealisasi.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    batch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'lra_upload_batch', key: 'id' },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    id_sub_kegiatan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'sub_kegiatan', key: 'id_sub_kegiatan' },
    },
    id_sumber_anggaran: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'sumber_anggaran', key: 'id_sumber' },
    },
    bulan: { type: DataTypes.STRING(20), allowNull: false },
    tahun: { type: DataTypes.INTEGER, allowNull: false },
    realisasi_rp: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: 'lra_realisasi',
    underscored: true,
    timestamps: true,
  }
);

export default LraRealisasi;
