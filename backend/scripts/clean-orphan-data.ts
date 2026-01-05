import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  password: 'admin',
  database: 'evkin_db',
  host: 'localhost',
  port: 5432
});

async function cleanOrphanData() {
  console.log('Cleaning orphan data...\n');

  // Check orphan data in sub_kegiatan_sumber_dana
  const orphanCheck = await pool.query(`
    SELECT sksd.id_sub_kegiatan 
    FROM sub_kegiatan_sumber_dana sksd
    WHERE NOT EXISTS (
      SELECT 1 FROM sub_kegiatan sk WHERE sk.id_sub_kegiatan = sksd.id_sub_kegiatan
    )
  `);
  console.log(`Found ${orphanCheck.rows.length} orphan records in sub_kegiatan_sumber_dana`);
  
  if (orphanCheck.rows.length > 0) {
    // Delete orphan records
    const result = await pool.query(`
      DELETE FROM sub_kegiatan_sumber_dana 
      WHERE id_sub_kegiatan NOT IN (SELECT id_sub_kegiatan FROM sub_kegiatan)
    `);
    console.log(`Deleted ${result.rowCount} orphan records from sub_kegiatan_sumber_dana`);
  }

  // Check orphan data in sub_kegiatan_target
  const orphanTarget = await pool.query(`
    SELECT skt.id_sub_kegiatan 
    FROM sub_kegiatan_target skt
    WHERE NOT EXISTS (
      SELECT 1 FROM sub_kegiatan sk WHERE sk.id_sub_kegiatan = skt.id_sub_kegiatan
    )
  `);
  console.log(`Found ${orphanTarget.rows.length} orphan records in sub_kegiatan_target`);
  
  if (orphanTarget.rows.length > 0) {
    const result = await pool.query(`
      DELETE FROM sub_kegiatan_target 
      WHERE id_sub_kegiatan NOT IN (SELECT id_sub_kegiatan FROM sub_kegiatan)
    `);
    console.log(`Deleted ${result.rowCount} orphan records from sub_kegiatan_target`);
  }

  // Check orphan data in anggaran_kas
  const orphanAngkas = await pool.query(`
    SELECT ak.id_sub_kegiatan 
    FROM anggaran_kas ak
    WHERE ak.id_sub_kegiatan IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM sub_kegiatan sk WHERE sk.id_sub_kegiatan = ak.id_sub_kegiatan
    )
  `);
  console.log(`Found ${orphanAngkas.rows.length} orphan records in anggaran_kas`);
  
  if (orphanAngkas.rows.length > 0) {
    const result = await pool.query(`
      DELETE FROM anggaran_kas 
      WHERE id_sub_kegiatan IS NOT NULL 
        AND id_sub_kegiatan NOT IN (SELECT id_sub_kegiatan FROM sub_kegiatan)
    `);
    console.log(`Deleted ${result.rowCount} orphan records from anggaran_kas`);
  }

  console.log('\n✓ Cleanup complete!');
  await pool.end();
}

cleanOrphanData().catch(console.error);
