import { Model, Optional } from 'sequelize';
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
interface LraUploadBatchCreationAttributes extends Optional<LraUploadBatchAttributes, 'id' | 'row_count' | 'created_at' | 'updated_at'> {
}
declare class LraUploadBatch extends Model<LraUploadBatchAttributes, LraUploadBatchCreationAttributes> implements LraUploadBatchAttributes {
    id: string;
    filename: string;
    bulan: string;
    tahun: number;
    uploaded_by: string;
    row_count: number;
    readonly created_at: Date;
    readonly updated_at: Date;
}
export default LraUploadBatch;
//# sourceMappingURL=LraUploadBatch.d.ts.map