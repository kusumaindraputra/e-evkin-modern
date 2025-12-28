import { Model, Optional } from 'sequelize';
interface PuskesmasEditPermissionAttributes {
    id: number;
    user_id: string | null;
    scope: string;
    bulan?: string | null;
    tahun: number;
    enabled: boolean;
    start_at?: Date | null;
    end_at?: Date | null;
    created_by: string;
    readonly created_at?: Date;
    readonly updated_at?: Date;
}
interface PuskesmasEditPermissionCreationAttributes extends Optional<PuskesmasEditPermissionAttributes, 'id' | 'bulan' | 'start_at' | 'end_at' | 'created_at' | 'updated_at'> {
}
declare class PuskesmasEditPermission extends Model<PuskesmasEditPermissionAttributes, PuskesmasEditPermissionCreationAttributes> implements PuskesmasEditPermissionAttributes {
    id: number;
    user_id: string | null;
    scope: string;
    bulan: string | null;
    tahun: number;
    enabled: boolean;
    start_at: Date | null;
    end_at: Date | null;
    created_by: string;
    readonly created_at: Date;
    readonly updated_at: Date;
}
export default PuskesmasEditPermission;
//# sourceMappingURL=PuskesmasEditPermission.d.ts.map