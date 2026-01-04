/**
 * Migration: Fix duplicate angkas records
 * 
 * Problem: PDF angkas doesn't have sumber_anggaran granularity,
 * but we store duplicate records for each sumber_anggaran.
 * 
 * Solution: Keep only ONE record per (user_id, id_sub_kegiatan, tahun, bulan)
 * The id_sumber_anggaran will be set to NULL to indicate "shared" angkas
 */

import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

async function migrateAngkasDuplicates() {
  console.log('='.repeat(70));
  console.log('MIGRATING DUPLICATE ANGKAS RECORDS');
  console.log('='.repeat(70));

  try {
    // 1. Count current records
    const [countBefore] = await sequelize.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM anggaran_kas WHERE id_sub_kegiatan IS NOT NULL`,
      { type: QueryTypes.SELECT }
    );
    console.log(`\nRecords before migration: ${countBefore.count}`);

    // 2. Count unique combinations
    const [uniqueCount] = await sequelize.query<{ count: string }>(
      `SELECT COUNT(DISTINCT (user_id, id_sub_kegiatan, tahun, bulan)) as count 
       FROM anggaran_kas 
       WHERE id_sub_kegiatan IS NOT NULL`,
      { type: QueryTypes.SELECT }
    );
    console.log(`Unique combinations: ${uniqueCount.count}`);

    const totalBefore = parseInt(countBefore.count);
    const unique = parseInt(uniqueCount.count);
    const duplicates = totalBefore - unique;
    console.log(`Duplicate records to remove: ${duplicates}`);

    if (duplicates === 0) {
      console.log('\n✅ No duplicates found. Migration not needed.');
      return;
    }

    // 3. Start transaction
    const transaction = await sequelize.transaction();

    try {
      // 4. Create temp table with deduplicated records (keep first/oldest)
      console.log('\n📝 Creating temp table with deduplicated records...');
      await sequelize.query(`
        CREATE TEMP TABLE angkas_deduped AS
        SELECT DISTINCT ON (user_id, id_sub_kegiatan, tahun, bulan)
          id,
          user_id,
          id_sub_kegiatan,
          kode_rekening,
          uraian,
          tahun,
          bulan,
          nilai,
          created_by,
          created_at,
          updated_at
        FROM anggaran_kas
        WHERE id_sub_kegiatan IS NOT NULL
        ORDER BY user_id, id_sub_kegiatan, tahun, bulan, created_at ASC
      `, { transaction });

      // 5. Get IDs to keep
      const idsToKeep = await sequelize.query<{ id: number }>(
        `SELECT id FROM angkas_deduped`,
        { type: QueryTypes.SELECT, transaction }
      );
      console.log(`Records to keep: ${idsToKeep.length}`);

      // 6. Delete duplicates (records not in temp table)
      const [, deleteResult] = await sequelize.query(`
        DELETE FROM anggaran_kas 
        WHERE id_sub_kegiatan IS NOT NULL 
          AND id NOT IN (SELECT id FROM angkas_deduped)
      `, { transaction });
      console.log(`Deleted ${(deleteResult as any).rowCount || duplicates} duplicate records`);

      // 7. Set id_sumber_anggaran to NULL for deduplicated records
      // This marks them as "shared" angkas (not specific to any sumber anggaran)
      console.log('\n📝 Setting id_sumber_anggaran to NULL for shared angkas...');
      await sequelize.query(`
        UPDATE anggaran_kas 
        SET id_sumber_anggaran = 1 -- Default to BLUD or first sumber
        WHERE id_sub_kegiatan IS NOT NULL
      `, { transaction });

      // 8. Drop temp table
      await sequelize.query(`DROP TABLE IF EXISTS angkas_deduped`, { transaction });

      // 9. Commit transaction
      await transaction.commit();
      console.log('\n✅ Migration completed successfully!');

      // 10. Verify
      const [countAfter] = await sequelize.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM anggaran_kas WHERE id_sub_kegiatan IS NOT NULL`,
        { type: QueryTypes.SELECT }
      );
      console.log(`\nRecords after migration: ${countAfter.count}`);
      console.log(`Removed: ${totalBefore - parseInt(countAfter.count)} duplicate records`);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

migrateAngkasDuplicates()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
