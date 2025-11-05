import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Kegiatan from './Kegiatan';

interface SubKegiatanAttributes {
  id_sub_kegiatan: number;
  id_kegiatan: number;
  kode_sub: string;
  kegiatan: string;
  indikator_kinerja: string;
}

class SubKegiatan extends Model<SubKegiatanAttributes> implements SubKegiatanAttributes {
  declare id_sub_kegiatan: number;
  declare id_kegiatan: number;
  declare kode_sub: string;
  declare kegiatan: string;
  declare indikator_kinerja: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SubKegiatan.init(
  {
    id_sub_kegiatan: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_kegiatan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'kegiatan',
        key: 'id_kegiatan',
      },
    },
    kode_sub: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    kegiatan: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    indikator_kinerja: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'sub_kegiatan',
    timestamps: true,
  }
);

// Define relation
SubKegiatan.belongsTo(Kegiatan, {
  foreignKey: 'id_kegiatan',
  as: 'kegiatanParent',
});

Kegiatan.hasMany(SubKegiatan, {
  foreignKey: 'id_kegiatan',
  as: 'subKegiatan',
});

export default SubKegiatan;
