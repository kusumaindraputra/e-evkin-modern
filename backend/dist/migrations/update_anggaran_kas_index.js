"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
async function updateIndexes() {
    const transaction = await database_1.default.transaction();
    try {
        console.log('Starting migration: update_anggaran_kas_index');
        // Check if table exists
        const [tableCheck] = await database_1.default.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'anggaran_kas'
      );
    `, { transaction });
        if (!tableCheck[0]?.exists) {
            console.log('Table anggaran_kas does not exist. Skipping migration.');
            await transaction.commit();
            return;
        }
        // Drop unique index if exists
        console.log('Dropping unique index if exists...');
        await database_1.default.query(`
      DROP INDEX IF EXISTS anggaran_kas_unique_entry;
    `, { transaction });
        // Create regular lookup index
        console.log('Creating lookup index...');
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS anggaran_kas_lookup_entry 
      ON anggaran_kas (user_id, kode_rekening, id_sumber_anggaran, tahun, bulan);
    `, { transaction });
        // Create created_at index for ordering
        console.log('Creating created_at index...');
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS anggaran_kas_created_at 
      ON anggaran_kas (created_at DESC);
    `, { transaction });
        await transaction.commit();
        console.log('✅ Migration completed successfully!');
        console.log('Changes applied:');
        console.log('  - Dropped unique constraint (anggaran_kas_unique_entry)');
        console.log('  - Created regular lookup index (anggaran_kas_lookup_entry)');
        console.log('  - Created created_at index for ordering');
    }
    catch (error) {
        await transaction.rollback();
        console.error('❌ Migration failed:', error.message);
        throw error;
    }
    finally {
        await database_1.default.close();
    }
}
// Run the migration
updateIndexes()
    .then(() => {
    console.log('Migration script finished');
    process.exit(0);
})
    .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
});
//# sourceMappingURL=update_anggaran_kas_index.js.map