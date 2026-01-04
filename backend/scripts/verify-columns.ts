import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  password: 'admin',
  database: 'evkin_db',
  host: 'localhost',
  port: 5432
});

async function checkColumns() {
  const result = await pool.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'sub_kegiatan_target' 
    ORDER BY ordinal_position
  `);
  
  console.log('Columns in sub_kegiatan_target:');
  result.rows.forEach((r: any) => {
    console.log(`  - ${r.column_name} (${r.data_type}, ${r.is_nullable === 'YES' ? 'nullable' : 'required'})`);
  });
  
  // Check for required columns
  const requiredColumns = ['id_satuan', 'catatan'];
  const existingColumns = result.rows.map((r: any) => r.column_name);
  
  console.log('\n=== Required Columns Check ===');
  requiredColumns.forEach(col => {
    const exists = existingColumns.includes(col);
    console.log(`${exists ? '✓' : '✗'} ${col}`);
  });
  
  await pool.end();
}

checkColumns().catch(console.error);
