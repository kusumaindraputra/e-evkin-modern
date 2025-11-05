import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface SatuanAttributes {
  id_satuan: number;
  satuannya: string;
}

class Satuan extends Model<SatuanAttributes> implements SatuanAttributes {
  declare id_satuan: number;
  declare satuannya: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Satuan.init(
  {
    id_satuan: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    satuannya: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'satuan',
    timestamps: true,
  }
);

export default Satuan;
