import { Laporan } from '../models';
interface CreateLaporanParams {
    user_id: string;
    id_sub_kegiatan: number;
    id_sumber_anggaran: number;
    tahun: number;
    bulan: string;
    realisasi_k?: number;
    realisasi_rp?: number;
    angkas?: number;
    status?: any;
    [key: string]: any;
}
interface UpdateLaporanParams {
    id: string;
    user_id: string;
    role: string;
    data: Partial<CreateLaporanParams>;
}
interface LaporanFilterParams {
    user_id?: string;
    role?: string;
    bulan?: string;
    tahun?: number;
    status?: string;
    page?: number;
    limit?: number;
}
export declare class LaporanService {
    static findAll(params: LaporanFilterParams): Promise<{
        rows: Laporan[];
        count: number;
    }>;
    static findById(id: string, requesterId: string, requesterRole: string): Promise<Laporan>;
    static create(params: CreateLaporanParams): Promise<Laporan>;
    static bulkCreate(laporanArray: any[], requesterId: string, requesterRole: string): Promise<Laporan[]>;
    static bulkUpsert(laporanArray: any[], requesterId: string, requesterRole: string): Promise<{
        created: number;
        updated: number;
        skipped: number;
        errors: string[];
    }>;
    static update(params: UpdateLaporanParams): Promise<Laporan>;
    static delete(id: string, requesterId: string, requesterRole: string): Promise<boolean>;
    static submit(bulan: string, tahun: number, requesterId: string, requesterRole: string, userIdParam?: string): Promise<number>;
}
export {};
//# sourceMappingURL=laporan.service.d.ts.map