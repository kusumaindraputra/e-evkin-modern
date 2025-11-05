import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface SumberAnggaranAttributes {
  id_sumber: number;
  sumber: string;
}

class SumberAnggaran extends Model<SumberAnggaranAttributes> implements SumberAnggaranAttributes {
  declare id_sumber: number;
  declare sumber: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SumberAnggaran.init(
  {
    id_sumber: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sumber: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'sumber_anggaran',
    timestamps: true,
  }
);

export default SumberAnggaran;
