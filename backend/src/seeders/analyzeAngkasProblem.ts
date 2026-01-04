/**
 * Script to analyze the angkas (Anggaran Kas) problem where:
 * - Sub kegiatan has multiple sumber anggaran
 * - But PDF only has one value per sub kegiatan (not split by sumber anggaran)
 * - This causes duplicate angkas values for different sumber anggaran
 */

import sequelize from '../config/database';
import { Op } from 'sequelize';
import User from '../models/User';
import AnggaranKas from '../models/AnggaranKas';
import SubKegiatan from '../models/SubKegiatan';
import SumberAnggaran from '../models/SumberAnggaran';
import SubKegiatanSumberAnggaran from '../models/SubKegiatanSumberAnggaran';
import SubKegiatanTarget from '../models/SubKegiatanTarget';

async function analyze() {
  console.log('='.repeat(70));
  console.log('ANALYZING ANGKAS DATA PROBLEM');
  console.log('='.repeat(70));
  
  // 1. Find Babakan Madang user
  const user = await User.findOne({ 
    where: { nama_puskesmas: { [Op.iLike]: '%babakan madang%' } } 
  });
  
  if (!user) {
    console.log('❌ Babakan Madang user not found');
    return;
  }
  
  console.log(`\n✅ User: ${user.nama_puskesmas} (${user.id})`);
  console.log(`   Kode Sub Unit: ${user.kode_sub_unit}`);
  
  // 2. Find sub kegiatan 1.02.02.2.02.0033
  const subKegiatan = await SubKegiatan.findOne({ 
    where: { kode_sub: '1.02.02.2.02.0033' } 
  });
  
  if (!subKegiatan) {
    console.log('❌ Sub kegiatan 1.02.02.2.02.0033 not found');
    return;
  }
  
  console.log(`\n✅ Sub Kegiatan: ${subKegiatan.kode_sub}`);
  console.log(`   Nama: ${subKegiatan.kegiatan}`);
  console.log(`   ID: ${subKegiatan.id_sub_kegiatan}`);
  
  // 3. Get sumber anggaran linked to this sub kegiatan
  const subKegSumberDana = await sequelize.query(`
    SELECT sksd.*, sa.sumber 
    FROM sub_kegiatan_sumber_dana sksd
    JOIN sumber_anggaran sa ON sksd.id_sumber_anggaran = sa.id_sumber
    WHERE sksd.id_sub_kegiatan = :idSubKegiatan
  `, { 
    replacements: { idSubKegiatan: subKegiatan.id_sub_kegiatan },
    type: 'SELECT' 
  }) as any[];
  
  console.log(`\n📋 Sumber Anggaran for this Sub Kegiatan (${subKegSumberDana.length} total):`);
  subKegSumberDana.forEach((s: any) => {
    console.log(`   - ${s.sumber} (id: ${s.id_sumber_anggaran})`);
  });
  
  // 4. Get targets for this sub kegiatan
  const targets = await SubKegiatanTarget.findAll({
    where: {
      user_id: user.id,
      id_sub_kegiatan: subKegiatan.id_sub_kegiatan,
      tahun: 2025
    },
    include: [{ model: SumberAnggaran, as: 'sumberAnggaran' }]
  });
  
  console.log(`\n🎯 Targets for 2025 (${targets.length} total):`);
  targets.forEach(t => {
    console.log(`   - ${t.sumberAnggaran?.sumber}: Target K=${t.target_k}, Target Rp=${t.target_rp?.toLocaleString('id-ID')}`);
  });
  
  // 5. Get angkas data for this user and sub kegiatan
  const angkas = await sequelize.query(`
    SELECT ak.*, sa.sumber 
    FROM anggaran_kas ak
    JOIN sumber_anggaran sa ON ak.id_sumber_anggaran = sa.id_sumber
    WHERE ak.user_id = :userId
      AND ak.id_sub_kegiatan = :idSubKegiatan
      AND ak.tahun = 2025
    ORDER BY ak.id_sumber_anggaran, ak.bulan
  `, { 
    replacements: { 
      userId: user.id,
      idSubKegiatan: subKegiatan.id_sub_kegiatan 
    },
    type: 'SELECT' 
  }) as any[];
  
  console.log(`\n💰 Angkas records for 2025 (${angkas.length} total):`);
  
  // Group by sumber anggaran
  const groupedBySumber: Record<string, any[]> = {};
  angkas.forEach((a: any) => {
    const key = `${a.id_sumber_anggaran} - ${a.sumber || 'Unknown'}`;
    if (!groupedBySumber[key]) groupedBySumber[key] = [];
    groupedBySumber[key].push(a);
  });
  
  for (const [sumber, records] of Object.entries(groupedBySumber)) {
    console.log(`\n   ${sumber}:`);
    const total = records.reduce((sum, r) => sum + r.nilai, 0);
    console.log(`   Total: Rp ${total.toLocaleString('id-ID')}`);
    console.log(`   Bulan: ${records.map(r => `${r.bulan}=${r.nilai.toLocaleString('id-ID')}`).join(', ')}`);
  }
  
  // 6. Detect the problem
  console.log('\n' + '='.repeat(70));
  console.log('PROBLEM ANALYSIS');
  console.log('='.repeat(70));
  
  const sumberCount = Object.keys(groupedBySumber).length;
  const angkasValues = Object.values(groupedBySumber);
  
  if (sumberCount > 1) {
    // Check if values are the same across different sumber anggaran
    const firstSumberValues = angkasValues[0].map(a => a.nilai).sort((a, b) => a - b);
    let allSame = true;
    
    for (let i = 1; i < angkasValues.length; i++) {
      const otherValues = angkasValues[i].map(a => a.nilai).sort((a, b) => a - b);
      if (JSON.stringify(firstSumberValues) !== JSON.stringify(otherValues)) {
        allSame = false;
        break;
      }
    }
    
    if (allSame) {
      console.log('\n⚠️  PROBLEM DETECTED:');
      console.log('    Multiple sumber anggaran have IDENTICAL angkas values!');
      console.log('    This is likely because PDF does not split by sumber anggaran.');
      console.log('\n    Current state:');
      for (const [sumber, records] of Object.entries(groupedBySumber)) {
        const total = records.reduce((sum, r) => sum + r.nilai, 0);
        console.log(`      - ${sumber}: Rp ${total.toLocaleString('id-ID')}`);
      }
      console.log(`    Grand total (doubled): Rp ${angkas.reduce((sum, a) => sum + a.nilai, 0).toLocaleString('id-ID')}`);
    } else {
      console.log('\n✅ Values differ between sumber anggaran - this is correct behavior.');
    }
  }
  
  // 7. Propose solutions
  console.log('\n' + '='.repeat(70));
  console.log('POSSIBLE SOLUTIONS');
  console.log('='.repeat(70));
  
  console.log(`
1. OPTION A - Store angkas only once per kode_rekening (recommended for PDF source)
   - Change AnggaranKas to NOT have id_sumber_anggaran
   - When displaying in Laporan, show the same angkas for all sumber anggaran
   - Pros: Accurate representation of PDF data
   - Cons: Cannot track angkas per sumber anggaran

2. OPTION B - Split angkas proportionally based on Target Rp
   - If Target BLUD = 60%, JKN = 40%, split angkas accordingly
   - Requires target data to be uploaded first
   - Pros: Allows tracking per sumber anggaran
   - Cons: May not match actual allocation

3. OPTION C - Keep as-is but mark as "shared" angkas
   - Add flag indicating angkas is shared across sumber anggaran
   - UI can show warning/note
   - When calculating, divide by number of sumber anggaran

4. OPTION D - Use only ONE sumber anggaran per sub kegiatan for angkas
   - Default to the "primary" sumber anggaran
   - Other sumber anggaran won't have angkas
   - Laporan UI shows "N/A" for angkas on secondary sumber

Current Recommendation:
- For accurate reporting, implement OPTION A or OPTION D
- PDF data fundamentally doesn't have sumber anggaran granularity
`);

  // 8. Check if this is widespread
  console.log('\n' + '='.repeat(70));
  console.log('CHECKING HOW WIDESPREAD THIS ISSUE IS');
  console.log('='.repeat(70));
  
  // Find sub kegiatan that have multiple sumber anggaran
  const multiSumberSubKegiatan = await sequelize.query(`
    SELECT 
      sk.id_sub_kegiatan, 
      sk.kode_sub, 
      sk.kegiatan,
      COUNT(DISTINCT sksd.id_sumber_anggaran) as sumber_count
    FROM sub_kegiatan sk
    JOIN sub_kegiatan_sumber_anggaran sksd ON sk.id_sub_kegiatan = sksd.id_sub_kegiatan
    GROUP BY sk.id_sub_kegiatan, sk.kode_sub, sk.kegiatan
    HAVING COUNT(DISTINCT sksd.id_sumber_anggaran) > 1
    ORDER BY sumber_count DESC
  `, { type: 'SELECT' }) as any[];
  
  console.log(`\n📊 Sub Kegiatan with multiple Sumber Anggaran: ${multiSumberSubKegiatan.length}`);
  console.log('\nTop 10:');
  multiSumberSubKegiatan.slice(0, 10).forEach(sk => {
    console.log(`   - ${sk.kode_sub}: ${sk.sumber_count} sumber anggaran`);
  });
  
  // Check how many have duplicate angkas
  const duplicateAngkas = await sequelize.query(`
    SELECT 
      ak.user_id,
      ak.id_sub_kegiatan,
      ak.tahun,
      ak.bulan,
      COUNT(*) as duplicate_count,
      array_agg(ak.id_sumber_anggaran) as sumber_ids
    FROM anggaran_kas ak
    WHERE ak.id_sub_kegiatan IS NOT NULL
    GROUP BY ak.user_id, ak.id_sub_kegiatan, ak.tahun, ak.bulan
    HAVING COUNT(*) > 1
    LIMIT 20
  `, { type: 'SELECT' }) as any[];
  
  console.log(`\n📊 Sub Kegiatan with duplicate angkas (same user, sub keg, month): ${duplicateAngkas.length}`);
  
  await sequelize.close();
}

analyze().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
