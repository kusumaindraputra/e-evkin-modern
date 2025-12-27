/**
 * Migration: Add Performance Indexes
 * Purpose: Improve query performance for frequently accessed columns
 *
 * Run: npx tsx src/migrations/add_performance_indexes.ts
 */
import { QueryInterface } from 'sequelize';
declare function up(queryInterface: QueryInterface): Promise<void>;
declare function down(queryInterface: QueryInterface): Promise<void>;
export { up, down };
//# sourceMappingURL=add_performance_indexes.d.ts.map