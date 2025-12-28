/**
 * Migration: Update anggaran_kas index to support history tracking
 *
 * Changes:
 * - Drop unique constraint (anggaran_kas_unique_entry)
 * - Create regular index for lookup (anggaran_kas_lookup_entry)
 * - Add index on created_at for ordering
 *
 * Run: cd backend && npx tsx src/migrations/update_anggaran_kas_index.ts
 */
export {};
//# sourceMappingURL=update_anggaran_kas_index.d.ts.map