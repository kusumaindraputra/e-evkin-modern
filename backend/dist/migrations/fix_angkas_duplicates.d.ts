/**
 * Migration: Fix duplicate angkas records
 *
 * Problem: PDF angkas doesn't have sumber_anggaran granularity,
 * but we store duplicate records for each sumber_anggaran.
 *
 * Solution: Keep only ONE record per (user_id, id_sub_kegiatan, tahun, bulan)
 * The id_sumber_anggaran will be set to NULL to indicate "shared" angkas
 */
export {};
//# sourceMappingURL=fix_angkas_duplicates.d.ts.map