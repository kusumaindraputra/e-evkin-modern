import { Model, Optional } from 'sequelize';
interface SubKegiatanTargetAttributes {
    id: number;
    user_id: string;
    id_sub_kegiatan: number;
    id_sumber_anggaran: number;
    id_satuan?: number | null;
    target_k: number;
    target_rp: number;
    bulan?: string | null;
    tahun: number;
    catatan?: string | null;
    created_by: string;
    created_at?: Date;
    updated_at?: Date;
}
interface SubKegiatanTargetCreationAttributes extends Optional<SubKegiatanTargetAttributes, 'id' | 'created_at' | 'updated_at'> {
}
declare class SubKegiatanTarget extends Model<SubKegiatanTargetAttributes, SubKegiatanTargetCreationAttributes> implements SubKegiatanTargetAttributes {
    id: number;
    user_id: string;
    id_sub_kegiatan: number;
    id_sumber_anggaran: number;
    id_satuan: number | null;
    target_k: number;
    target_rp: number;
    bulan: string | null;
    tahun: number;
    catatan: string | null;
    created_by: string;
    readonly created_at: Date;
    readonly updated_at: Date;
}
export default SubKegiatanTarget;
//# sourceMappingURL=SubKegiatanTarget.d.ts.map