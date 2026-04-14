import { Model, Optional } from 'sequelize';
interface LraRealisasiAttributes {
    id: number;
    batch_id: string;
    user_id: string;
    id_sub_kegiatan: number;
    id_sumber_anggaran: number;
    bulan: string;
    tahun: number;
    realisasi_rp: number;
    created_at?: Date;
    updated_at?: Date;
}
interface LraRealisasiCreationAttributes extends Optional<LraRealisasiAttributes, 'id' | 'created_at' | 'updated_at'> {
}
declare class LraRealisasi extends Model<LraRealisasiAttributes, LraRealisasiCreationAttributes> implements LraRealisasiAttributes {
    id: number;
    batch_id: string;
    user_id: string;
    id_sub_kegiatan: number;
    id_sumber_anggaran: number;
    bulan: string;
    tahun: number;
    realisasi_rp: number;
    readonly created_at: Date;
    readonly updated_at: Date;
}
export default LraRealisasi;
//# sourceMappingURL=LraRealisasi.d.ts.map