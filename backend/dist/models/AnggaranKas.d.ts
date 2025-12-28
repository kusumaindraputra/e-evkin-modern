import { Model, Optional } from 'sequelize';
interface AnggaranKasAttributes {
    id: number;
    user_id: string;
    id_sub_kegiatan: number | null;
    id_sumber_anggaran: number;
    kode_rekening: string;
    uraian: string;
    tahun: number;
    bulan: number;
    nilai: number;
    created_by: string | null;
    created_at?: Date;
    updated_at?: Date;
}
interface AnggaranKasCreationAttributes extends Optional<AnggaranKasAttributes, 'id' | 'created_at' | 'updated_at'> {
}
declare class AnggaranKas extends Model<AnggaranKasAttributes, AnggaranKasCreationAttributes> implements AnggaranKasAttributes {
    id: number;
    user_id: string;
    id_sub_kegiatan: number | null;
    id_sumber_anggaran: number;
    kode_rekening: string;
    uraian: string;
    tahun: number;
    bulan: number;
    nilai: number;
    created_by: string | null;
    readonly created_at: Date;
    readonly updated_at: Date;
}
export default AnggaranKas;
//# sourceMappingURL=AnggaranKas.d.ts.map