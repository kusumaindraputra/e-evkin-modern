import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface PuskesmasEditPermissionAttributes {
  id: number;
  user_id: string | null; // UUID puskesmas, null = all puskesmas
  scope: string; // e.g., 'target_kinerja'
  bulan?: string | null; // optional monthly window
  tahun: number; // target year
  enabled: boolean; // admin override
  start_at?: Date | null; // window start
  end_at?: Date | null; // window end
  created_by: string; // admin user id
  readonly created_at?: Date;
  readonly updated_at?: Date;
}

interface PuskesmasEditPermissionCreationAttributes
  extends Optional<
    PuskesmasEditPermissionAttributes,
    'id' | 'bulan' | 'start_at' | 'end_at' | 'created_at' | 'updated_at'
  > {}

class PuskesmasEditPermission
  extends Model<PuskesmasEditPermissionAttributes, PuskesmasEditPermissionCreationAttributes>
  implements PuskesmasEditPermissionAttributes
{
  declare id: number;
  declare user_id: string | null;
  declare scope: string;
  declare bulan: string | null;
  declare tahun: number;
  declare enabled: boolean;
  declare start_at: Date | null;
  declare end_at: Date | null;
  declare created_by: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

PuskesmasEditPermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    scope: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    bulan: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    tahun: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    start_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
  },
  {
    sequelize,
    tableName: 'puskesmas_edit_permission',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id', 'scope', 'bulan', 'tahun'] },
      { fields: ['created_at'] },
    ],
  }
);

PuskesmasEditPermission.belongsTo(User, { foreignKey: 'user_id', as: 'puskesmas' });
PuskesmasEditPermission.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

export default PuskesmasEditPermission;
