import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import SubKegiatan from './SubKegiatan';

interface PuskesmasSubKegiatanAttributes {
  id: number;
  user_id: string; // UUID
  id_sub_kegiatan: number;
  created_at?: Date;
  updated_at?: Date;
}

interface PuskesmasSubKegiatanCreationAttributes extends Optional<PuskesmasSubKegiatanAttributes, 'id'> {}

class PuskesmasSubKegiatan extends Model<PuskesmasSubKegiatanAttributes, PuskesmasSubKegiatanCreationAttributes> implements PuskesmasSubKegiatanAttributes {
  declare id: number;
  declare user_id: string; // UUID
  declare id_sub_kegiatan: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

PuskesmasSubKegiatan.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    id_sub_kegiatan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sub_kegiatan',
        key: 'id_sub_kegiatan',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'puskesmas_sub_kegiatan',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'id_sub_kegiatan'],
      },
    ],
  }
);

// Define associations
PuskesmasSubKegiatan.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'puskesmas',
});

PuskesmasSubKegiatan.belongsTo(SubKegiatan, {
  foreignKey: 'id_sub_kegiatan',
  as: 'subKegiatan',
});

// Many-to-many relationships
User.belongsToMany(SubKegiatan, {
  through: PuskesmasSubKegiatan,
  foreignKey: 'user_id',
  otherKey: 'id_sub_kegiatan',
  as: 'assignedSubKegiatan',
});

SubKegiatan.belongsToMany(User, {
  through: PuskesmasSubKegiatan,
  foreignKey: 'id_sub_kegiatan',
  otherKey: 'user_id',
  as: 'assignedPuskesmas',
});

export default PuskesmasSubKegiatan;
