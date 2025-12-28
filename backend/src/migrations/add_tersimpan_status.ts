/**
 * Migration to add 'tersimpan' status to laporan ENUM
 * 
 * The frontend uses 'tersimpan' status for draft reports that haven't been submitted yet.
 * This was missing from the database ENUM, causing potential insertion errors.
 * 
 * Run: npx tsx src/migrations/add_tersimpan_status.ts
 */

import sequelize from '../config/database';

async function migrate() {
  try {
    console.log('🚀 Starting migration: add_tersimpan_status');

    // PostgreSQL: Add new value to ENUM type
    // First check if value already exists
    const [existingValues] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_laporan_status)) as status
    `);
    
    const statuses = (existingValues as any[]).map((r: any) => r.status);
    console.log('📋 Current ENUM values:', statuses);

    if (statuses.includes('tersimpan')) {
      console.log('✅ "tersimpan" status already exists in ENUM. No migration needed.');
      return;
    }

    // Add 'tersimpan' to the ENUM type
    await sequelize.query(`
      ALTER TYPE enum_laporan_status ADD VALUE IF NOT EXISTS 'tersimpan'
    `);

    console.log('✅ Successfully added "tersimpan" to enum_laporan_status');

    // Verify the change
    const [newValues] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_laporan_status)) as status
    `);
    console.log('📋 Updated ENUM values:', (newValues as any[]).map((r: any) => r.status));

  } catch (error: any) {
    // Handle case where enum type doesn't exist yet (fresh database)
    if (error.message.includes('does not exist')) {
      console.log('⚠️ ENUM type does not exist yet. It will be created when the model syncs.');
      return;
    }
    
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

migrate().then(() => {
  console.log('🎉 Migration completed');
  process.exit(0);
}).catch((err) => {
  console.error('💥 Migration error:', err);
  process.exit(1);
});
