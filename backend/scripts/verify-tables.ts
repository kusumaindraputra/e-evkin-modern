import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  password: 'admin',
  database: 'evkin_db',
  host: 'localhost',
  port: 5432
});

async function checkTables() {
  const result = await pool.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  console.log('Tables in database:');
  result.rows.forEach((r: any) => console.log('  -', r.tablename));
  console.log('\nTotal tables:', result.rows.length);
  
  // Check required tables
  const requiredTables = [
    'users',
    'laporan',
    'satuan',
    'sumber_anggaran',
    'kegiatan',
    'sub_kegiatan',
    'sub_kegiatan_target',
    'sub_kegiatan_sumber_anggaran',
    'puskesmas_sub_kegiatan',
    'anggaran_kas',
    'puskesmas_edit_permission'
  ];
  
  const existingTables = result.rows.map((r: any) => r.tablename);
  console.log('\n=== Required Tables Check ===');
  requiredTables.forEach(table => {
    const exists = existingTables.includes(table);
    console.log(`${exists ? '✓' : '✗'} ${table}`);
  });
  
  await pool.end();
}

checkTables().catch(console.error);
