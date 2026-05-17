"use strict";
/**
 * Run this script to create lra_upload_batch and lra_realisasi tables
 * Usage: cd backend && npx tsx src/migrations/run_lra_tables.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: path_1.default.join(process.cwd(), '.env') });
const database_1 = __importDefault(require("../config/database"));
const create_lra_tables_1 = __importDefault(require("./create_lra_tables"));
async function runMigration() {
    try {
        await database_1.default.authenticate();
        console.log('DB connected');
        await create_lra_tables_1.default.up(database_1.default.getQueryInterface());
        console.log('Migration OK - lra_upload_batch and lra_realisasi created');
        process.exit(0);
    }
    catch (error) {
        console.error('Migration FAILED:', error.message);
        process.exit(1);
    }
}
runMigration();
//# sourceMappingURL=run_lra_tables.js.map