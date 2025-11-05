import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface KegiatanAttributes {
  id_kegiatan: number;
  id_uraian: number;
  kode: string;
  kegiatan: string;
}

class Kegiatan extends Model<KegiatanAttributes> implements KegiatanAttributes {
  declare id_kegiatan: number;
  declare id_uraian: number;
  declare kode: string;
  declare kegiatan: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Kegiatan.init(
  {
    id_kegiatan: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_uraian: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    kode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    kegiatan: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'kegiatan',
    timestamps: true,
  }
);

export default Kegiatan;
