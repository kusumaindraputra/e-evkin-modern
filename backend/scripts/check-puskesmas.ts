import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  password: 'admin',
  database: 'evkin_db',
  host: 'localhost',
  port: 5432
});

async function main() {
  const result = await pool.query(
    "SELECT id, nama_puskesmas, kode_sub_unit FROM users WHERE role='puskesmas' ORDER BY nama_puskesmas"
  );
  
  console.log('Total puskesmas in DB:', result.rows.length);
  console.log('\nPuskesmas list:');
  result.rows.forEach((u: any) => {
    console.log(`${u.nama_puskesmas} => ${u.kode_sub_unit || 'NULL'}`);
  });
  
  const withCode = result.rows.filter((u: any) => u.kode_sub_unit);
  const withoutCode = result.rows.filter((u: any) => !u.kode_sub_unit);
  
  console.log('\n=== Summary ===');
  console.log('With kode_sub_unit:', withCode.length);
  console.log('Without kode_sub_unit:', withoutCode.length);
  
  if (withoutCode.length > 0) {
    console.log('\nMissing kode_sub_unit:');
    withoutCode.forEach((u: any) => console.log(`  - ${u.nama_puskesmas}`));
  }
  
  await pool.end();
}

main().catch(console.error);
