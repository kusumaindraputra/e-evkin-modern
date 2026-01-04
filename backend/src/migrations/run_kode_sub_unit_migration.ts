/**
 * Script to run the kode_sub_unit migration
 * Run: npx tsx src/migrations/run_kode_sub_unit_migration.ts
 */

import { sequelize } from '../config/database';
import { up } from './add_kode_sub_unit_to_users';

async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Check if column already exists
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable('users');
    
    if (tableInfo.kode_sub_unit) {
      console.log('⚠️ Column kode_sub_unit already exists, skipping migration');
    } else {
      await up(queryInterface);
      console.log('Migration completed successfully');
    }

    await sequelize.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
