import xlsx from 'xlsx';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  password: 'admin',
  database: 'evkin_db',
  host: 'localhost',
  port: 5432
});

// Manual mapping for puskesmas names that differ between DB and Excel
// DB Name => Excel Name (from "Puskesmas X" in Excel)
const manualMapping: Record<string, string> = {
  'Lebakwangi': 'Lebak Wangi',      // DB: Lebakwangi, Excel: Puskesmas Lebak Wangi
  'Kota Batu': 'Kota batu',          // DB: Kota Batu, Excel: Puskesmas Kota batu (lowercase)
  'Karyamekar': 'Karya Mekar',       // DB: Karyamekar, Excel: Puskesmas Karya Mekar
  'Tajur': 'Tajurhalang',            // DB: Tajur is separate from Tajurhalang - check if this is correct
};

async function main() {
  const wb = xlsx.readFile('../Rekap_Ver3 (7).xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1, range: 0 }) as any[][];

  // Extract unique kode_sub_unit -> nama_sub_unit mapping for Puskesmas only
  const puskesmasMap = new Map<string, string>();
  data.slice(1).forEach((row) => {
    const kode = row[6];
    const nama = row[7];
    if (kode && nama && typeof kode === 'string' && kode.startsWith('1.02.0.00.0.00.01.0') && nama.toLowerCase().includes('puskesmas')) {
      if (!puskesmasMap.has(kode)) {
        // Extract puskesmas name without 'Puskesmas ' prefix
        const cleanName = nama.replace(/^Puskesmas\s+/i, '').trim();
        puskesmasMap.set(kode, cleanName);
      }
    }
  });

  // Get all puskesmas users
  const users = await pool.query("SELECT id, nama_puskesmas, kode_sub_unit FROM users WHERE role='puskesmas'");
  
  console.log('Total puskesmas in Excel:', puskesmasMap.size);
  console.log('Total puskesmas users in DB:', users.rows.length);
  
  let updated = 0;
  let skipped = 0;
  const notFoundExcel: string[] = [];
  const notFoundDB: string[] = [];
  
  for (const [kode, namaFromExcel] of puskesmasMap) {
    // Find matching user by nama_puskesmas (case insensitive)
    // First try exact match, then try manual mapping
    let user = users.rows.find((u: any) => 
      u.nama_puskesmas && 
      u.nama_puskesmas.toLowerCase() === namaFromExcel.toLowerCase()
    );
    
    // If not found, try reverse manual mapping (Excel name -> DB name)
    if (!user) {
      // Find DB name that maps to this Excel name
      const dbName = Object.entries(manualMapping).find(([_, excelName]) => 
        excelName.toLowerCase() === namaFromExcel.toLowerCase()
      )?.[0];
      
      if (dbName) {
        user = users.rows.find((u: any) => 
          u.nama_puskesmas && 
          u.nama_puskesmas.toLowerCase() === dbName.toLowerCase()
        );
      }
    }
    
    if (user) {
      if (user.kode_sub_unit === kode) {
        skipped++;
      } else {
        await pool.query('UPDATE users SET kode_sub_unit = $1 WHERE id = $2', [kode, user.id]);
        updated++;
        console.log(`Updated ${user.nama_puskesmas} -> ${kode}`);
      }
    } else {
      notFoundExcel.push(namaFromExcel);
    }
  }
  
  // Check which DB puskesmas still don't have kode_sub_unit
  const usersAfter = await pool.query("SELECT nama_puskesmas FROM users WHERE role='puskesmas' AND kode_sub_unit IS NULL ORDER BY nama_puskesmas");
  usersAfter.rows.forEach((u: any) => notFoundDB.push(u.nama_puskesmas));
  
  console.log('\n=== Summary ===');
  console.log('Updated:', updated);
  console.log('Skipped (already had correct kode):', skipped);
  console.log('Excel puskesmas not found in DB:', notFoundExcel.length);
  if (notFoundExcel.length > 0) {
    console.log('  From Excel but not in DB:', notFoundExcel.sort());
  }
  console.log('DB puskesmas still without kode_sub_unit:', notFoundDB.length);
  if (notFoundDB.length > 0) {
    console.log('  In DB but without kode:', notFoundDB.sort());
  }
  
  // Verify final state
  const verify = await pool.query(`
    SELECT nama_puskesmas, kode_sub_unit 
    FROM users 
    WHERE role='puskesmas' 
    ORDER BY nama_puskesmas
  `);
  console.log('\n=== Final State ===');
  console.log('Total puskesmas with kode_sub_unit:', verify.rows.filter((r: any) => r.kode_sub_unit).length);
  console.log('Total puskesmas without kode_sub_unit:', verify.rows.filter((r: any) => !r.kode_sub_unit).length);
  
  await pool.end();
}

main().catch(console.error);
