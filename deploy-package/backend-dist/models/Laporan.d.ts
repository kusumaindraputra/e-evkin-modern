import { Model, Optional } from 'sequelize';
interface LaporanAttributes {
    id: string;
    user_id: string;
    id_kegiatan: number;
    id_sub_kegiatan: number;
    id_sumber_anggaran: number;
    id_satuan: number;
    target_k: number;
    angkas: number;
    target_rp: number;
    realisasi_k: number;
    realisasi_rp: number;
    permasalahan: string;
    upaya: string;
    bulan: string;
    tahun: number;
    status?: 'menunggu' | 'terkirim' | 'diverifikasi' | 'ditolak' | 'tersimpan';
    catatan?: string;
    verified_by?: string;
    verified_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}
interface LaporanCreationAttributes extends Optional<LaporanAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> {
}
declare class Laporan extends Model<LaporanAttributes, LaporanCreationAttributes> implements LaporanAttributes {
    id: string;
    user_id: string;
    id_kegiatan: number;
    id_sub_kegiatan: number;
    id_sumber_anggaran: number;
    id_satuan: number;
    target_k: number;
    angkas: number;
    target_rp: number;
    realisasi_k: number;
    realisasi_rp: number;
    permasalahan: string;
    upaya: string;
    bulan: string;
    tahun: number;
    status?: 'menunggu' | 'terkirim' | 'diverifikasi' | 'ditolak' | 'tersimpan';
    catatan?: string;
    verified_by?: string;
    verified_at?: Date;
    readonly created_at: Date;
    readonly updated_at: Date;
}
export default Laporan;
//# sourceMappingURL=Laporan.d.ts.map