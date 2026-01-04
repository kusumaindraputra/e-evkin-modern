/**
 * End-to-End Test Script
 * Tests the complete flow: Clean data → Input Targets → Input Laporan → Verify Dashboard
 */

import { Op } from 'sequelize';

// Import models and sequelize from models index
import { sequelize, User, Kegiatan, SubKegiatan, Satuan, SumberAnggaran, SubKegiatanTarget, Laporan } from '../models';

const TAHUN = 2026;
const BULAN_LIST = ['Januari', 'Februari', 'Maret'];

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

function log(step: string, success: boolean, message: string, data?: any) {
  results.push({ step, success, message, data });
  const icon = success ? '✅' : '❌';
  console.log(`${icon} [${step}] ${message}`);
  if (data && !success) {
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
}

async function cleanData() {
  console.log('\n========== STEP 1: CLEAN DATA ==========\n');
  
  try {
    // Delete laporan for test year
    const deletedLaporan = await Laporan.destroy({ 
      where: { tahun: TAHUN } 
    });
    log('Clean Laporan', true, `Deleted ${deletedLaporan} laporan records for tahun ${TAHUN}`);

    // Delete targets for test year
    const deletedTargets = await SubKegiatanTarget.destroy({ 
      where: { tahun: TAHUN } 
    });
    log('Clean Targets', true, `Deleted ${deletedTargets} target records for tahun ${TAHUN}`);

    return true;
  } catch (error: any) {
    log('Clean Data', false, error.message);
    return false;
  }
}

async function setupTestData() {
  console.log('\n========== STEP 2: SETUP TEST DATA ==========\n');
  
  try {
    // Get admin user
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      log('Get Admin', false, 'Admin user not found');
      return null;
    }
    log('Get Admin', true, `Found admin: ${admin.username}`);

    // Get puskesmas users
    const puskesmasList = await User.findAll({ 
      where: { role: 'puskesmas' },
      order: [['nama_puskesmas', 'ASC']],
      limit: 5  // Test with 5 puskesmas
    });
    if (puskesmasList.length === 0) {
      log('Get Puskesmas', false, 'No puskesmas users found');
      return null;
    }
    log('Get Puskesmas', true, `Found ${puskesmasList.length} puskesmas: ${puskesmasList.map(p => p.nama_puskesmas).join(', ')}`);

    // Get sub kegiatan with sumber anggaran
    const subKegiatanList = await SubKegiatan.findAll({
      include: [{
        model: SumberAnggaran,
        as: 'sumberAnggaranList',
        through: { attributes: [] }
      }],
      limit: 3  // Test with 3 sub kegiatan
    });
    if (subKegiatanList.length === 0) {
      log('Get SubKegiatan', false, 'No sub kegiatan found');
      return null;
    }
    log('Get SubKegiatan', true, `Found ${subKegiatanList.length} sub kegiatan`);

    // Get satuan
    const satuan = await Satuan.findOne();
    if (!satuan) {
      log('Get Satuan', false, 'No satuan found');
      return null;
    }
    log('Get Satuan', true, `Found satuan: ${satuan.satuannya}`);

    return { admin, puskesmasList, subKegiatanList, satuan };
  } catch (error: any) {
    log('Setup Test Data', false, error.message);
    return null;
  }
}

async function inputTargets(testData: any) {
  console.log('\n========== STEP 3: INPUT TARGETS ==========\n');
  
  const { admin, puskesmasList, subKegiatanList, satuan } = testData;
  const targetsCreated: any[] = [];

  try {
    for (const puskesmas of puskesmasList) {
      for (const subKegiatan of subKegiatanList) {
        const sumberAnggaranList = (subKegiatan as any).sumberAnggaranList || [];
        
        // Skip sub kegiatan without sumber anggaran
        if (sumberAnggaranList.length === 0) {
          console.log(`  ⚠️ Skip ${subKegiatan.kegiatan} - no sumber anggaran`);
          continue;
        }
        
        for (const sumberAnggaran of sumberAnggaranList) {
          // Create target with predictable values for verification
          const target_k = 100;  // Fixed for easy calculation
          const target_rp = 10000000;  // 10 juta per target
          
          const target = await SubKegiatanTarget.create({
            user_id: puskesmas.id,
            id_sub_kegiatan: subKegiatan.id_sub_kegiatan,
            id_sumber_anggaran: sumberAnggaran.id_sumber,  // Use id_sumber, not id_sumber_anggaran
            id_satuan: satuan.id_satuan,
            target_k,
            target_rp,
            tahun: TAHUN,
            created_by: admin.id,
          });
          
          targetsCreated.push({
            puskesmas: puskesmas.nama_puskesmas,
            subKegiatan: subKegiatan.kegiatan,
            sumberAnggaran: sumberAnggaran.sumber_anggaran,
            target_k,
            target_rp
          });
        }
      }
    }

    log('Create Targets', true, `Created ${targetsCreated.length} targets`);
    
    // Verify targets
    const targetCount = await SubKegiatanTarget.count({ where: { tahun: TAHUN } });
    log('Verify Targets', targetCount === targetsCreated.length, 
      `Target count in DB: ${targetCount}, Expected: ${targetsCreated.length}`);

    return targetsCreated;
  } catch (error: any) {
    log('Input Targets', false, error.message);
    return null;
  }
}

async function inputLaporan(testData: any, targetsCreated: any[]) {
  console.log('\n========== STEP 4: INPUT LAPORAN ==========\n');
  
  const { puskesmasList, subKegiatanList, satuan } = testData;
  const laporanCreated: any[] = [];
  
  // Define realization percentages per month for verification
  const realisasiPercentages: Record<string, number> = {
    'Januari': 0.3,   // 30%
    'Februari': 0.5,  // 50%
    'Maret': 0.7,     // 70%
  };

  try {
    for (const bulan of BULAN_LIST) {
      const percentage = realisasiPercentages[bulan];
      
      for (const puskesmas of puskesmasList) {
        for (const subKegiatan of subKegiatanList) {
          const sumberAnggaranList = (subKegiatan as any).sumberAnggaranList || [];
          
          for (const sumberAnggaran of sumberAnggaranList) {
            // Find corresponding target
            const target = await SubKegiatanTarget.findOne({
              where: {
                user_id: puskesmas.id,
                id_sub_kegiatan: subKegiatan.id_sub_kegiatan,
                id_sumber_anggaran: sumberAnggaran.id_sumber,  // Use id_sumber
                tahun: TAHUN
              }
            });

            if (!target) continue;

            // Calculate realisasi based on percentage
            const target_k = target.target_k;
            const target_rp = target.target_rp;
            const realisasi_k = Math.round(target_k * percentage);
            const realisasi_rp = Math.round(target_rp * percentage);
            const realisasi_fisik = percentage * 100;  // Convert to percentage

            const laporan = await Laporan.create({
              user_id: puskesmas.id,
              id_kegiatan: subKegiatan.id_kegiatan,  // Add id_kegiatan
              id_sub_kegiatan: subKegiatan.id_sub_kegiatan,
              id_sumber_anggaran: sumberAnggaran.id_sumber,  // Use id_sumber
              id_satuan: satuan.id_satuan,
              bulan,
              tahun: TAHUN,
              target_k,
              target_rp,
              angkas: target_rp,  // Set angkas same as target for test
              realisasi_k,
              realisasi_rp,
              realisasi_fisik,
              permasalahan: '-',  // Required field
              upaya: '-',  // Required field
              status: 'terkirim',  // Set as submitted for dashboard
            });

            laporanCreated.push({
              bulan,
              puskesmas: puskesmas.nama_puskesmas,
              subKegiatan: subKegiatan.kegiatan,
              target_rp,
              realisasi_rp,
              percentage: percentage * 100
            });
          }
        }
      }
      
      log(`Input Laporan ${bulan}`, true, 
        `Created laporan for ${bulan} with ${percentage * 100}% realisasi`);
    }

    // Verify laporan count
    const laporanCount = await Laporan.count({ where: { tahun: TAHUN } });
    // @ts-ignore - implicit types ok for seeder
    const expectedCount = BULAN_LIST.length * puskesmasList.length * 
      subKegiatanList.reduce((sum: number, sk: any) => sum + ((sk as any).sumberAnggaranList?.length || 0), 0);
    
    log('Verify Laporan Count', laporanCount === expectedCount,
      `Laporan count in DB: ${laporanCount}, Expected: ${expectedCount}`);

    return laporanCreated;
  } catch (error: any) {
    log('Input Laporan', false, error.message);
    return null;
  }
}

async function verifyDashboardData(testData: any) {
  console.log('\n========== STEP 5: VERIFY DASHBOARD DATA ==========\n');
  
  const { puskesmasList, subKegiatanList } = testData;

  try {
    // 1. Verify budget data by month
    console.log('\n--- Budget Data by Month ---');
    const budgetByMonth = await Laporan.findAll({
      attributes: [
        'bulan',
        [sequelize.fn('SUM', sequelize.col('target_rp')), 'total_target'],
        [sequelize.fn('SUM', sequelize.col('realisasi_rp')), 'total_realisasi'],
      ],
      where: { 
        tahun: TAHUN,
        status: 'terkirim'
      },
      group: ['bulan'],
      raw: true,
    }) as any[];

    for (const data of budgetByMonth) {
      const total_target = parseFloat(data.total_target) || 0;
      const total_realisasi = parseFloat(data.total_realisasi) || 0;
      const percentage = total_target > 0 ? (total_realisasi / total_target * 100).toFixed(2) : 0;
      
      console.log(`  ${data.bulan}: Target=${formatRupiah(total_target)}, Realisasi=${formatRupiah(total_realisasi)}, %=${percentage}%`);
    }
    log('Budget by Month', budgetByMonth.length === BULAN_LIST.length,
      `Found ${budgetByMonth.length} months of data`);

    // 2. Verify total statistics
    console.log('\n--- Total Statistics ---');
    const totalStats = await Laporan.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('target_rp')), 'total_target'],
        [sequelize.fn('SUM', sequelize.col('realisasi_rp')), 'total_realisasi'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_laporan'],
      ],
      where: { 
        tahun: TAHUN,
        status: 'terkirim'
      },
      raw: true,
    }) as any;

    const total_target = parseFloat(totalStats.total_target) || 0;
    const total_realisasi = parseFloat(totalStats.total_realisasi) || 0;
    const overall_percentage = total_target > 0 ? (total_realisasi / total_target * 100).toFixed(2) : 0;
    
    console.log(`  Total Target: ${formatRupiah(total_target)}`);
    console.log(`  Total Realisasi: ${formatRupiah(total_realisasi)}`);
    console.log(`  Overall Percentage: ${overall_percentage}%`);
    console.log(`  Total Laporan: ${totalStats.total_laporan}`);

    // Expected calculation:
    // Each target = 10,000,000
    // Number of targets per puskesmas = subKegiatanList * sumberAnggaran per subKegiatan
    // Total per month = puskesmas * targets * 10,000,000
    // Realisasi: Jan=30%, Feb=50%, Mar=70%
    // Average = (30+50+70)/3 = 50%
    // @ts-ignore - implicit types ok for seeder
    const numSumberAnggaran = subKegiatanList.reduce(
      (sum: number, sk: any) => sum + ((sk as any).sumberAnggaranList?.length || 0), 0
    );
    const targetsPerPuskesmas = numSumberAnggaran;
    const totalTargetsAllPuskesmas = puskesmasList.length * targetsPerPuskesmas;
    const targetPerRecord = 10000000;
    
    const expectedTotalTargetPerMonth = totalTargetsAllPuskesmas * targetPerRecord;
    const expectedTotalTarget = expectedTotalTargetPerMonth * BULAN_LIST.length;
    
    // Weighted average realisasi
    const expectedRealisasiJan = expectedTotalTargetPerMonth * 0.3;
    const expectedRealisasiFeb = expectedTotalTargetPerMonth * 0.5;
    const expectedRealisasiMar = expectedTotalTargetPerMonth * 0.7;
    const expectedTotalRealisasi = expectedRealisasiJan + expectedRealisasiFeb + expectedRealisasiMar;
    const expectedPercentage = (expectedTotalRealisasi / expectedTotalTarget * 100).toFixed(2);

    console.log('\n--- Expected Values ---');
    console.log(`  Puskesmas: ${puskesmasList.length}`);
    console.log(`  Targets per Puskesmas: ${targetsPerPuskesmas}`);
    console.log(`  Expected Total Target: ${formatRupiah(expectedTotalTarget)}`);
    console.log(`  Expected Total Realisasi: ${formatRupiah(expectedTotalRealisasi)}`);
    console.log(`  Expected Percentage: ${expectedPercentage}%`);

    const targetMatch = Math.abs(total_target - expectedTotalTarget) < 1;
    const realisasiMatch = Math.abs(total_realisasi - expectedTotalRealisasi) < 1;
    
    log('Verify Total Target', targetMatch,
      `Actual: ${total_target}, Expected: ${expectedTotalTarget}`);
    log('Verify Total Realisasi', realisasiMatch,
      `Actual: ${total_realisasi}, Expected: ${expectedTotalRealisasi}`);

    // 3. Verify puskesmas reporting count
    console.log('\n--- Puskesmas Reporting ---');
    const puskesmasReporting = await Laporan.count({
      distinct: true,
      col: 'user_id',
      where: { 
        tahun: TAHUN,
        bulan: 'Januari',
        status: 'terkirim'
      },
    });
    
    log('Puskesmas Reporting', puskesmasReporting === puskesmasList.length,
      `Reporting: ${puskesmasReporting}, Expected: ${puskesmasList.length}`);

    // 4. Verify status counts
    console.log('\n--- Status Counts ---');
    const statusCounts = await Laporan.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: { tahun: TAHUN },
      group: ['status'],
      raw: true,
    }) as any[];

    for (const sc of statusCounts) {
      console.log(`  ${sc.status}: ${sc.count}`);
    }

    const allSubmitted = statusCounts.every(sc => sc.status === 'terkirim');
    log('All Laporan Submitted', allSubmitted, 
      `All laporan should be 'terkirim'`);

    return true;
  } catch (error: any) {
    log('Verify Dashboard', false, error.message);
    return false;
  }
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

async function printSummary() {
  console.log('\n========== TEST SUMMARY ==========\n');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  
  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  ❌ [${r.step}] ${r.message}`);
    });
  }
  
  return failed === 0;
}

async function main() {
  console.log('='.repeat(60));
  console.log('E-EVKIN MODERN - End-to-End Test');
  console.log('='.repeat(60));
  console.log(`Test Year: ${TAHUN}`);
  console.log(`Test Months: ${BULAN_LIST.join(', ')}`);
  console.log('='.repeat(60));

  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Step 1: Clean data
    const cleaned = await cleanData();
    if (!cleaned) {
      console.log('❌ Failed to clean data, aborting test');
      process.exit(1);
    }

    // Step 2: Setup test data
    const testData = await setupTestData();
    if (!testData) {
      console.log('❌ Failed to setup test data, aborting test');
      process.exit(1);
    }

    // Step 3: Input targets
    const targetsCreated = await inputTargets(testData);
    if (!targetsCreated) {
      console.log('❌ Failed to create targets, aborting test');
      process.exit(1);
    }

    // Step 4: Input laporan
    const laporanCreated = await inputLaporan(testData, targetsCreated);
    if (!laporanCreated) {
      console.log('❌ Failed to create laporan, aborting test');
      process.exit(1);
    }

    // Step 5: Verify dashboard data
    const verified = await verifyDashboardData(testData);

    // Print summary
    const allPassed = await printSummary();

    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED! 🎉\n');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED ⚠️\n');
    }

    process.exit(allPassed ? 0 : 1);
  } catch (error: any) {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

main();
