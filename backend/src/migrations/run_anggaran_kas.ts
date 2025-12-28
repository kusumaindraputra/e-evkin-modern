/**
 * Run this script to create the anggaran_kas table
 * Usage: cd backend && npx tsx src/migrations/run_anggaran_kas.ts
 */

import sequelize from '../config/database';
import '../models'; // Import all models to load associations
import AnggaranKas from '../models/AnggaranKas';

async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync only the AnggaranKas model
    await AnggaranKas.sync({ alter: true });
    console.log('✅ Table anggaran_kas created/updated successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
