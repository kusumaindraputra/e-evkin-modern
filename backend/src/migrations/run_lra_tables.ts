/**
 * Run this script to create lra_upload_batch and lra_realisasi tables
 * Usage: cd backend && npx tsx src/migrations/run_lra_tables.ts
 */

import path from 'path';
import { config } from 'dotenv';
config({ path: path.join(process.cwd(), '.env') });

import sequelize from '../config/database';
import migration from './create_lra_tables';

async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    await migration.up(sequelize.getQueryInterface());
    console.log('Migration OK - lra_upload_batch and lra_realisasi created');

    process.exit(0);
  } catch (error: any) {
    console.error('Migration FAILED:', error.message);
    process.exit(1);
  }
}

runMigration();
