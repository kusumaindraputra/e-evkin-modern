/**
 * Migration: Add Performance Indexes for Optimization
 * Purpose: Add composite indexes for frequently queried columns
 *
 * Run: npx tsx src/migrations/add_optimization_indexes.ts
 */
import { QueryInterface } from 'sequelize';
declare function up(queryInterface: QueryInterface): Promise<void>;
declare function down(queryInterface: QueryInterface): Promise<void>;
export { up, down };
//# sourceMappingURL=add_optimization_indexes.d.ts.map