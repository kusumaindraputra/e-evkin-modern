"use strict";
/**
 * Migration to add 'tersimpan' status to laporan ENUM
 *
 * The frontend uses 'tersimpan' status for draft reports that haven't been submitted yet.
 * This was missing from the database ENUM, causing potential insertion errors.
 *
 * Run: npx tsx src/migrations/add_tersimpan_status.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
async function migrate() {
    try {
        console.log('🚀 Starting migration: add_tersimpan_status');
        // PostgreSQL: Add new value to ENUM type
        // First check if value already exists
        const [existingValues] = await database_1.default.query(`
      SELECT unnest(enum_range(NULL::enum_laporan_status)) as status
    `);
        const statuses = existingValues.map((r) => r.status);
        console.log('📋 Current ENUM values:', statuses);
        if (statuses.includes('tersimpan')) {
            console.log('✅ "tersimpan" status already exists in ENUM. No migration needed.');
            return;
        }
        // Add 'tersimpan' to the ENUM type
        await database_1.default.query(`
      ALTER TYPE enum_laporan_status ADD VALUE IF NOT EXISTS 'tersimpan'
    `);
        console.log('✅ Successfully added "tersimpan" to enum_laporan_status');
        // Verify the change
        const [newValues] = await database_1.default.query(`
      SELECT unnest(enum_range(NULL::enum_laporan_status)) as status
    `);
        console.log('📋 Updated ENUM values:', newValues.map((r) => r.status));
    }
    catch (error) {
        // Handle case where enum type doesn't exist yet (fresh database)
        if (error.message.includes('does not exist')) {
            console.log('⚠️ ENUM type does not exist yet. It will be created when the model syncs.');
            return;
        }
        console.error('❌ Migration failed:', error);
        throw error;
    }
    finally {
        await database_1.default.close();
    }
}
migrate().then(() => {
    console.log('🎉 Migration completed');
    process.exit(0);
}).catch((err) => {
    console.error('💥 Migration error:', err);
    process.exit(1);
});
//# sourceMappingURL=add_tersimpan_status.js.map