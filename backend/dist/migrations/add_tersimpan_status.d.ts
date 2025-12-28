/**
 * Migration to add 'tersimpan' status to laporan ENUM
 *
 * The frontend uses 'tersimpan' status for draft reports that haven't been submitted yet.
 * This was missing from the database ENUM, causing potential insertion errors.
 *
 * Run: npx tsx src/migrations/add_tersimpan_status.ts
 */
export {};
//# sourceMappingURL=add_tersimpan_status.d.ts.map