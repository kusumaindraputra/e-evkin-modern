import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SumberAnggaranAttributes {
  id_sumber: number;
  sumber: string;
}

interface SumberAnggaranCreationAttributes extends Optional<SumberAnggaranAttributes, 'id_sumber'> {}

class SumberAnggaran extends Model<SumberAnggaranAttributes, SumberAnggaranCreationAttributes> implements SumberAnggaranAttributes {
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
