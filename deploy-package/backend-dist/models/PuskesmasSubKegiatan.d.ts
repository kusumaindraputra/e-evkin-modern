import { Model, Optional } from 'sequelize';
interface PuskesmasSubKegiatanAttributes {
    id: number;
    user_id: string;
    id_sub_kegiatan: number;
    created_at?: Date;
    updated_at?: Date;
}
interface PuskesmasSubKegiatanCreationAttributes extends Optional<PuskesmasSubKegiatanAttributes, 'id'> {
}
declare class PuskesmasSubKegiatan extends Model<PuskesmasSubKegiatanAttributes, PuskesmasSubKegiatanCreationAttributes> implements PuskesmasSubKegiatanAttributes {
    id: number;
    user_id: string;
    id_sub_kegiatan: number;
    readonly created_at: Date;
    readonly updated_at: Date;
}
export default PuskesmasSubKegiatan;
//# sourceMappingURL=PuskesmasSubKegiatan.d.ts.map