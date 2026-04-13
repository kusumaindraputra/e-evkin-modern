// backend/src/models/LraUploadBatch.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface LraUploadBatchAttributes {
  id: string;
  filename: string;
  bulan: string;
  tahun: number;
  uploaded_by: string;
  row_count: number;
  created_at?: Date;
  updated_at?: Date;
}

interface LraUploadBatchCreationAttributes
  extends Optional<LraUploadBatchAttributes, 'id' | 'row_count' | 'created_at' | 'updated_at'> {}

class LraUploadBatch
  extends Model<LraUploadBatchAttributes, LraUploadBatchCreationAttributes>
  implements LraUploadBatchAttributes {
  public id!: string;
  public filename!: string;
  public bulan!: string;
  public tahun!: number;
  public uploaded_by!: string;
  public row_count!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

LraUploadBatch.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    filename: { type: DataTypes.STRING(255), allowNull: false },
    bulan: { type: DataTypes.STRING(20), allowNull: false },
    tahun: { type: DataTypes.INTEGER, allowNull: false },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    row_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: 'lra_upload_batch',
    underscored: true,
    timestamps: true,
  }
);

export default LraUploadBatch;
