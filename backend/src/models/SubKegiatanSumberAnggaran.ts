import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SubKegiatanSumberAnggaranAttributes {
  id: number;
  id_sub_kegiatan: number;
  id_sumber_anggaran: number;
  is_active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SubKegiatanSumberAnggaranCreationAttributes 
  extends Optional<SubKegiatanSumberAnggaranAttributes, 'id' | 'is_active' | 'createdAt' | 'updatedAt'> {}

class SubKegiatanSumberAnggaran extends Model<SubKegiatanSumberAnggaranAttributes, SubKegiatanSumberAnggaranCreationAttributes> 
  implements SubKegiatanSumberAnggaranAttributes {
  declare id: number;
  declare id_sub_kegiatan: number;
  declare id_sumber_anggaran: number;
  declare is_active: boolean;
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SubKegiatanSumberAnggaran.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_sub_kegiatan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sub_kegiatan',
        key: 'id_sub_kegiatan',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    id_sumber_anggaran: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sumber_anggaran',
        key: 'id_sumber',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'sub_kegiatan_sumber_dana',
    timestamps: true,
    underscored: false, // Use camelCase for createdAt/updatedAt
    indexes: [
      {
        unique: true,
        fields: ['id_sub_kegiatan', 'id_sumber_anggaran'],
        name: 'unique_sub_kegiatan_sumber',
      },
      {
        fields: ['id_sub_kegiatan'],
      },
      {
        fields: ['id_sumber_anggaran'],
      },
    ],
  }
);

export default SubKegiatanSumberAnggaran;
