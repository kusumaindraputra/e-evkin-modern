"use strict";
/**
 * Run this script to create the anggaran_kas table
 * Usage: cd backend && npx tsx src/migrations/run_anggaran_kas.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
require("../models"); // Import all models to load associations
const AnggaranKas_1 = __importDefault(require("../models/AnggaranKas"));
async function runMigration() {
    try {
        await database_1.default.authenticate();
        console.log('✅ Database connected');
        // Sync only the AnggaranKas model
        await AnggaranKas_1.default.sync({ alter: true });
        console.log('✅ Table anggaran_kas created/updated successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}
runMigration();
//# sourceMappingURL=run_anggaran_kas.js.map