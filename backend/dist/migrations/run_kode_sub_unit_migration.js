"use strict";
/**
 * Script to run the kode_sub_unit migration
 * Run: npx tsx src/migrations/run_kode_sub_unit_migration.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const add_kode_sub_unit_to_users_1 = require("./add_kode_sub_unit_to_users");
async function runMigration() {
    try {
        await database_1.sequelize.authenticate();
        console.log('Database connected successfully');
        // Check if column already exists
        const queryInterface = database_1.sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('users');
        if (tableInfo.kode_sub_unit) {
            console.log('⚠️ Column kode_sub_unit already exists, skipping migration');
        }
        else {
            await (0, add_kode_sub_unit_to_users_1.up)(queryInterface);
            console.log('Migration completed successfully');
        }
        await database_1.sequelize.close();
        console.log('Database connection closed');
        process.exit(0);
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}
runMigration();
//# sourceMappingURL=run_kode_sub_unit_migration.js.map