import sequelize from '../src/config/database';

async function checkTargetData() {
  try {
    console.log('Checking sub_kegiatan_target table...\n');
    await sequelize.authenticate();
    
    // Count total records
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as count FROM sub_kegiatan_target
    `);
    console.log(`Total records in sub_kegiatan_target: ${(countResult as any[])[0].count}`);
    
    // Count by tahun
    const [byTahun] = await sequelize.query(`
      SELECT tahun, COUNT(*) as count, SUM(target_rp) as total_target_rp, COUNT(DISTINCT user_id) as unique_puskesmas
      FROM sub_kegiatan_target
      GROUP BY tahun
      ORDER BY tahun DESC
    `);
    console.log('\nRecords by tahun:');
    (byTahun as any[]).forEach((r: any) => {
      console.log(`  Tahun ${r.tahun}: ${r.count} records, ${r.unique_puskesmas} puskesmas, Total: Rp ${Number(r.total_target_rp).toLocaleString()}`);
    });
    
    // Sample recent records
    const [samples] = await sequelize.query(`
      SELECT skt.*, u.nama as puskesmas_nama, sk.kegiatan as sub_kegiatan_nama, sa.sumber as sumber_anggaran_nama
      FROM sub_kegiatan_target skt
      LEFT JOIN users u ON skt.user_id = u.id
      LEFT JOIN sub_kegiatan sk ON skt.id_sub_kegiatan = sk.id_sub_kegiatan
      LEFT JOIN sumber_anggaran sa ON skt.id_sumber_anggaran = sa.id_sumber
      ORDER BY skt.created_at DESC
      LIMIT 5
    `);
    
    if ((samples as any[]).length > 0) {
      console.log('\nSample recent target records:');
      (samples as any[]).forEach((s: any) => {
        console.log(`  - ${s.puskesmas_nama || 'Unknown'}: ${(s.sub_kegiatan_nama || 'Unknown').substring(0, 50)}... (${s.sumber_anggaran_nama}) - Rp ${Number(s.target_rp).toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkTargetData();
