import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import SubKegiatan from './SubKegiatan';
import SumberAnggaran from './SumberAnggaran';
import Satuan from './Satuan';

interface SubKegiatanTargetAttributes {
  id: number;
  user_id: string; // UUID puskesmas
  id_sub_kegiatan: number;
  id_sumber_anggaran: number;
  id_satuan?: number | null;
  target_k: number;
  target_rp: number;
  bulan?: string | null; // Optional for yearly targets
  tahun: number;
  created_by: string; // UUID user yang membuat/update
  created_at?: Date;
  updated_at?: Date;
}

interface SubKegiatanTargetCreationAttributes 
  extends Optional<SubKegiatanTargetAttributes, 'id' | 'created_at' | 'updated_at'> {}

class SubKegiatanTarget extends Model<SubKegiatanTargetAttributes, SubKegiatanTargetCreationAttributes> 
  implements SubKegiatanTargetAttributes {
  declare id: number;
  declare user_id: string;
  declare id_sub_kegiatan: number;
  declare id_sumber_anggaran: number;
  declare id_satuan: number | null;
  declare target_k: number;
  declare target_rp: number;
  declare bulan: string | null;
  declare tahun: number;
  declare created_by: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

SubKegiatanTarget.init(
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
    id_sumber_anggaran: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sumber_anggaran',
        key: 'id_sumber',
      },
      onDelete: 'CASCADE',
    },
    id_satuan: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'satuan',
        key: 'id_satuan',
      },
      onDelete: 'SET NULL',
    },
    target_k: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    target_rp: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    bulan: {
      type: DataTypes.STRING(20),
      allowNull: true, // Now allows null for yearly targets
    },
    tahun: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'sub_kegiatan_target',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'id_sub_kegiatan', 'id_sumber_anggaran', 'bulan', 'tahun'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['id_sub_kegiatan'],
      },
      {
        fields: ['id_sumber_anggaran'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

// Define associations
SubKegiatanTarget.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'puskesmas',
});

SubKegiatanTarget.belongsTo(SubKegiatan, {
  foreignKey: 'id_sub_kegiatan',
  as: 'subKegiatan',
});

SubKegiatanTarget.belongsTo(SumberAnggaran, {
  foreignKey: 'id_sumber_anggaran',
  as: 'sumberAnggaran',
});

SubKegiatanTarget.belongsTo(Satuan, {
  foreignKey: 'id_satuan',
  as: 'satuan',
});

SubKegiatanTarget.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

export default SubKegiatanTarget;
