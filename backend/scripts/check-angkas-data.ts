import sequelize from '../src/config/database';

async function checkAngkasData() {
  try {
    console.log('Checking anggaran_kas table...\n');
    await sequelize.authenticate();
    
    // Count total records
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as count FROM anggaran_kas
    `);
    console.log(`Total records in anggaran_kas: ${(countResult as any[])[0].count}`);
    
    // Count by tahun
    const [byTahun] = await sequelize.query(`
      SELECT tahun, bulan, COUNT(*) as count, SUM(nilai) as total_nilai
      FROM anggaran_kas
      GROUP BY tahun, bulan
      ORDER BY tahun DESC, bulan DESC
      LIMIT 20
    `);
    console.log('\nRecords by tahun/bulan (top 20):');
    (byTahun as any[]).forEach((r: any) => {
      console.log(`  Tahun ${r.tahun}, Bulan ${r.bulan}: ${r.count} records, Total: Rp ${Number(r.total_nilai).toLocaleString()}`);
    });
    
    // Sample recent records
    const [samples] = await sequelize.query(`
      SELECT ak.*, u.nama as puskesmas_nama
      FROM anggaran_kas ak
      LEFT JOIN users u ON ak.user_id = u.id
      ORDER BY ak.created_at DESC
      LIMIT 5
    `);
    
    if ((samples as any[]).length > 0) {
      console.log('\nSample recent angkas records:');
      (samples as any[]).forEach((s: any) => {
        console.log(`  - ${s.puskesmas_nama || 'Unknown'}: ${s.kode_rekening} - Bulan ${s.bulan}/${s.tahun} - Rp ${Number(s.nilai).toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkAngkasData();
