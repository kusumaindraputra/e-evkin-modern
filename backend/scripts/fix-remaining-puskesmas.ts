import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  password: 'admin',
  database: 'evkin_db',
  host: 'localhost',
  port: 5432
});

async function main() {
  // These puskesmas were missed because of typos in Excel (Puskemas vs Puskesmas)
  // or because they don't have "Puskesmas" prefix in Excel
  const updates = [
    { nama: 'Cibeuteung Udik', kode: '1.02.0.00.0.00.01.0090' },  // "Puskemas Cibeuteung Udik" in Excel
    { nama: 'Labkesda', kode: '1.02.0.00.0.00.01.0050' },         // "Labkesda" in Excel (no prefix)
    { nama: 'Tajur', kode: '1.02.0.00.0.00.01.0100' },            // "Puskemas Tajur" in Excel
  ];

  for (const { nama, kode } of updates) {
    const result = await pool.query(
      'UPDATE users SET kode_sub_unit = $1 WHERE nama_puskesmas = $2 RETURNING nama_puskesmas',
      [kode, nama]
    );
    if (result.rowCount && result.rowCount > 0) {
      console.log(`✓ Updated ${nama} -> ${kode}`);
    } else {
      console.log(`✗ Not found: ${nama}`);
    }
  }

  // Verify final state
  const verify = await pool.query(`
    SELECT nama_puskesmas, kode_sub_unit 
    FROM users 
    WHERE role = 'puskesmas' 
    ORDER BY nama_puskesmas
  `);

  const withCode = verify.rows.filter((r: any) => r.kode_sub_unit);
  const withoutCode = verify.rows.filter((r: any) => !r.kode_sub_unit);

  console.log('\n=== Final Summary ===');
  console.log(`Total puskesmas: ${verify.rows.length}`);
  console.log(`With kode_sub_unit: ${withCode.length}`);
  console.log(`Without kode_sub_unit: ${withoutCode.length}`);

  if (withoutCode.length > 0) {
    console.log('\nStill missing:');
    withoutCode.forEach((r: any) => console.log(`  - ${r.nama_puskesmas}`));
  } else {
    console.log('\n✓ All puskesmas have kode_sub_unit assigned!');
  }

  await pool.end();
}

main().catch(console.error);
