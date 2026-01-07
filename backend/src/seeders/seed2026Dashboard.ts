/**
 * Seed Data untuk Dashboard Testing - 2026 Januari sampai Maret
 * Puskesmas: Leuwiliang, Nanggung, Ciampea
 * 
 * Run: cd backend && npx tsx src/seeders/seed2026Dashboard.ts
 * Cleanup: Jalankan script ini dengan argument "cleanup"
 *          cd backend && npx tsx src/seeders/seed2026Dashboard.ts cleanup
 */

import { sequelize, SubKegiatanTarget, Laporan, User, SubKegiatan, SumberAnggaran, Satuan } from '../models';
import { v4 as uuidv4 } from 'uuid';

// Constants
const TAHUN = 2026;
const BULAN_LIST = ['Januari', 'Februari', 'Maret'];

// Puskesmas user IDs (dari database)
const PUSKESMAS_USERS = [
  { id: 'bbf904e4-2ab0-4a83-9ac8-461d406c4961', username: 'leuwiliang', nama: 'Leuwiliang' },
  { id: '334b813e-e85b-44d2-811f-da7defcfa0f3', username: 'nanggung', nama: 'Nanggung' },
  { id: '05b88a70-7b42-4115-b2d7-a0cfa5c6ec73', username: 'ciampea', nama: 'Ciampea' },
];

// Sub Kegiatan IDs (dari database) 
const SUB_KEGIATAN_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

// Sumber Anggaran IDs yang valid (dari database - exclude test data)
const SUMBER_ANGGARAN_IDS = [1, 2, 3, 4]; // BLUD, DAK, APBD, JKN

// Satuan IDs
const SATUAN_IDS = [1, 2, 3, 4, 5]; // Orang, Kegiatan, Dokumen, Paket, Kali

// Helper: random number between min and max
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: get random element from array
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate diverse target data for each puskesmas
function generateTargetData() {
  const targets: any[] = [];
  
  for (const user of PUSKESMAS_USERS) {
    // Each puskesmas gets 5-8 sub kegiatan with different sumber anggaran
    const selectedSubKeg = SUB_KEGIATAN_IDS.slice(0, randomBetween(5, 8));
    
    for (const idSubKeg of selectedSubKeg) {
      // Each sub kegiatan may have 1-2 sumber anggaran
      const numSumber = randomBetween(1, 2);
      const selectedSumber = SUMBER_ANGGARAN_IDS.slice(0, numSumber);
      
      for (const idSumber of selectedSumber) {
        const targetK = randomBetween(50, 500);
        const targetRp = randomBetween(5000000, 100000000); // 5jt - 100jt
        
        targets.push({
          user_id: user.id,
          id_sub_kegiatan: idSubKeg,
          id_sumber_anggaran: idSumber,
          id_satuan: randomFrom(SATUAN_IDS),
          target_k: targetK,
          target_rp: targetRp,
          tahun: TAHUN,
          bulan: null, // yearly target
          catatan: `Seed data dashboard 2026 - ${user.nama}`,
          created_by: user.id,
        });
      }
    }
  }
  
  return targets;
}

// Generate diverse laporan data for each month
function generateLaporanData(targets: any[]) {
  const laporans: any[] = [];
  const statusOptions = ['diverifikasi', 'terkirim', 'menunggu', 'tersimpan'];
  
  // Weight for status: diverifikasi (70%), terkirim (15%), menunggu (10%), tersimpan (5%)
  const getWeightedStatus = (bulanIndex: number): string => {
    // Earlier months more likely verified
    if (bulanIndex === 0) { // Januari
      const rand = Math.random();
      if (rand < 0.85) return 'diverifikasi';
      if (rand < 0.95) return 'terkirim';
      return 'menunggu';
    } else if (bulanIndex === 1) { // Februari
      const rand = Math.random();
      if (rand < 0.70) return 'diverifikasi';
      if (rand < 0.85) return 'terkirim';
      if (rand < 0.95) return 'menunggu';
      return 'tersimpan';
    } else { // Maret - mix of statuses
      const rand = Math.random();
      if (rand < 0.50) return 'diverifikasi';
      if (rand < 0.70) return 'terkirim';
      if (rand < 0.85) return 'menunggu';
      return 'tersimpan';
    }
  };
  
  for (const target of targets) {
    for (let bulanIndex = 0; bulanIndex < BULAN_LIST.length; bulanIndex++) {
      const bulan = BULAN_LIST[bulanIndex];
      
      // Calculate monthly target portion (roughly 1/12)
      const monthlyTargetK = Math.ceil(target.target_k / 12);
      const monthlyTargetRp = Math.ceil(target.target_rp / 12);
      
      // Cumulative angkas (sum from Jan to current month)
      const angkas = monthlyTargetRp * (bulanIndex + 1);
      
      // Realisasi varies - some meet target, some exceed, some fall short
      const performanceFactor = randomBetween(60, 120) / 100; // 60% - 120% of target
      const realisasiK = Math.floor(monthlyTargetK * performanceFactor * (bulanIndex + 1));
      const realisasiRp = Math.floor(monthlyTargetRp * performanceFactor * (bulanIndex + 1));
      
      // Realisasi fisik (physical achievement percentage)
      const realisasiFisik = Math.min(100, Math.round((realisasiK / (monthlyTargetK * (bulanIndex + 1))) * 100));
      
      const status = getWeightedStatus(bulanIndex);
      
      // Determine permasalahan and upaya based on performance
      let permasalahan = '';
      let upaya = '';
      
      if (performanceFactor < 0.8) {
        permasalahan = randomFrom([
          'Keterbatasan anggaran operasional',
          'Cuaca tidak mendukung kegiatan lapangan',
          'Kurangnya partisipasi masyarakat',
          'Keterbatasan SDM',
          'Kendala koordinasi lintas sektor',
        ]);
        upaya = randomFrom([
          'Melakukan efisiensi anggaran',
          'Penjadwalan ulang kegiatan',
          'Peningkatan sosialisasi ke masyarakat',
          'Koordinasi dengan BPJS',
          'Pengajuan penambahan tenaga',
        ]);
      }
      
      laporans.push({
        id: uuidv4(),
        user_id: target.user_id,
        id_kegiatan: Math.ceil(target.id_sub_kegiatan / 3), // Rough mapping
        id_sub_kegiatan: target.id_sub_kegiatan,
        id_sumber_anggaran: target.id_sumber_anggaran,
        id_satuan: target.id_satuan,
        target_k: monthlyTargetK * (bulanIndex + 1), // Cumulative
        target_rp: target.target_rp, // Yearly target
        target_angkas: angkas, // Manual input sama dengan angkas
        angkas: angkas,
        realisasi_k: realisasiK,
        realisasi_rp: realisasiRp,
        realisasi_fisik: realisasiFisik,
        permasalahan: permasalahan,
        upaya: upaya,
        bulan: bulan,
        tahun: TAHUN,
        status: status,
        catatan: performanceFactor < 0.8 ? 'Perlu perhatian khusus' : null,
        verified_by: status === 'diverifikasi' ? '139fc776-d1a2-4ad9-8ca8-6a20fb8107c8' : null, // dinkes user
        verified_at: status === 'diverifikasi' ? new Date() : null,
      });
    }
  }
  
  return laporans;
}

async function seed() {
  console.log('🌱 Starting seed for 2026 Dashboard data (Januari - Maret)...\n');
  
  try {
    // Generate data
    const targets = generateTargetData();
    const laporans = generateLaporanData(targets);
    
    console.log(`📊 Generated ${targets.length} target records`);
    console.log(`📊 Generated ${laporans.length} laporan records\n`);
    
    // Insert targets
    console.log('💾 Inserting SubKegiatanTarget records...');
    for (const target of targets) {
      await SubKegiatanTarget.findOrCreate({
        where: {
          user_id: target.user_id,
          id_sub_kegiatan: target.id_sub_kegiatan,
          id_sumber_anggaran: target.id_sumber_anggaran,
          tahun: target.tahun,
          bulan: null,
        },
        defaults: target,
      });
    }
    console.log('✅ Targets inserted\n');
    
    // Insert laporans
    console.log('💾 Inserting Laporan records...');
    for (const laporan of laporans) {
      await Laporan.findOrCreate({
        where: {
          user_id: laporan.user_id,
          id_sub_kegiatan: laporan.id_sub_kegiatan,
          id_sumber_anggaran: laporan.id_sumber_anggaran,
          bulan: laporan.bulan,
          tahun: laporan.tahun,
        },
        defaults: laporan,
      });
    }
    console.log('✅ Laporans inserted\n');
    
    // Summary
    console.log('📈 SUMMARY:');
    console.log('-------------------------------------------');
    for (const user of PUSKESMAS_USERS) {
      const userTargets = targets.filter(t => t.user_id === user.id).length;
      const userLaporans = laporans.filter(l => l.user_id === user.id).length;
      console.log(`   ${user.nama}: ${userTargets} targets, ${userLaporans} laporans`);
    }
    console.log('-------------------------------------------');
    console.log('\n✨ Seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  }
}

async function cleanup() {
  console.log('🧹 Starting cleanup of 2026 Dashboard seed data...\n');
  
  try {
    const userIds = PUSKESMAS_USERS.map(u => u.id);
    
    // Delete laporans for 2026 Jan-Mar
    console.log('🗑️  Deleting Laporan records...');
    const deletedLaporans = await Laporan.destroy({
      where: {
        user_id: userIds,
        tahun: TAHUN,
        bulan: BULAN_LIST,
      },
    });
    console.log(`   Deleted ${deletedLaporans} laporan records`);
    
    // Delete targets for 2026
    console.log('🗑️  Deleting SubKegiatanTarget records...');
    const deletedTargets = await SubKegiatanTarget.destroy({
      where: {
        user_id: userIds,
        tahun: TAHUN,
      },
    });
    console.log(`   Deleted ${deletedTargets} target records`);
    
    console.log('\n✨ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const isCleanup = args.includes('cleanup');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    if (isCleanup) {
      await cleanup();
    } else {
      await seed();
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
