/**
 * Migration: Create sub_kegiatan_sumber_dana junction table
 * Purpose: Enable many-to-many relationship between SubKegiatan and SumberAnggaran
 *
 * Run: npx tsx src/migrations/create_sub_kegiatan_sumber_dana.ts
 */
import { QueryInterface } from 'sequelize';
declare function up(queryInterface: QueryInterface): Promise<void>;
declare function down(queryInterface: QueryInterface): Promise<void>;
export { up, down };
//# sourceMappingURL=create_sub_kegiatan_sumber_dana.d.ts.map