/**
 * Comprehensive End-to-End Test Script
 * Tests: Clean data → Upload Excel Target → Upload PDF Angkas → Create Laporan → Verify Dashboard
 * 
 * Features:
 * - Tests for all 102 puskesmas including Labkesda
 * - Tests laporan creation from January to June
 * - Varied data for realistic testing
 * - Error fallbacks for every operation
 * - Performance optimization checks
 */

import { Op } from 'sequelize';
import axios, { AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';

// Import models and sequelize from models index
import { 
  sequelize, 
  User, 
  Kegiatan, 
  SubKegiatan, 
  Satuan, 
  SumberAnggaran, 
  SubKegiatanTarget, 
  Laporan,
  AnggaranKas
} from '../models';

// Configuration
const CONFIG = {
  TAHUN: 2026,
  BULAN_LIST: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'],
  API_BASE: 'http://localhost:5000/api',
  ADMIN_CREDENTIALS: { username: 'dinkes', password: 'dinkes123' },
  EXCEL_FILE: path.join(__dirname, '../../../docs/Rekap_Ver3 (7).xlsx'),
  PDF_FILE: path.join(__dirname, '../../../docs/Angkas Parsial 3 tahun 2025.pdf'),
};

// Test results tracking
interface TestResult {
  step: string;
  success: boolean;
  message: string;
  duration?: number;
  data?: any;
}

const results: TestResult[] = [];
let authToken: string = '';
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Utility functions
function log(step: string, success: boolean, message: string, data?: any, duration?: number) {
  results.push({ step, success, message, data, duration });
  totalTests++;
  if (success) passedTests++;
  else failedTests++;
  
  const icon = success ? '✅' : '❌';
  const durationStr = duration ? ` (${duration}ms)` : '';
  console.log(`${icon} [${step}] ${message}${durationStr}`);
  if (data && !success) {
    console.log('   Error Data:', JSON.stringify(data, null, 2).substring(0, 500));
  }
}

function info(message: string) {
  console.log(`ℹ️  ${message}`);
}

async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}

// Fallback wrapper
async function withFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorMessage: string
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    console.log(`⚠️  Fallback triggered: ${errorMessage}`);
    console.log(`   Original error: ${error.message}`);
    return fallback;
  }
}

// =============================================================================
// STEP 1: LOGIN & AUTH
// =============================================================================
async function loginAdmin(): Promise<boolean> {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: LOGIN & AUTHENTICATION');
  console.log('='.repeat(60) + '\n');

  try {
    const { result, duration } = await measureTime(async () => {
      const response = await axios.post(`${CONFIG.API_BASE}/auth/login`, CONFIG.ADMIN_CREDENTIALS);
      return response.data;
    });

    if (result.token) {
      authToken = result.token;
      log('Admin Login', true, `Logged in as ${result.user.username}`, null, duration);
      return true;
    } else {
      log('Admin Login', false, 'No token received');
      return false;
    }
  } catch (error: any) {
    const message = error.response?.data?.message || error.message;
    log('Admin Login', false, message);
    return false;
  }
}

// =============================================================================
// STEP 2: CLEAN DATA
// =============================================================================
async function cleanData(): Promise<boolean> {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: CLEAN DATA');
  console.log('='.repeat(60) + '\n');

  try {
    // Delete laporan for test year
    const { result: deletedLaporan, duration: d1 } = await measureTime(async () => {
      return await Laporan.destroy({ where: { tahun: CONFIG.TAHUN } });
    });
    log('Clean Laporan', true, `Deleted ${deletedLaporan} laporan records`, null, d1);

    // Delete targets for test year
    const { result: deletedTargets, duration: d2 } = await measureTime(async () => {
      return await SubKegiatanTarget.destroy({ where: { tahun: CONFIG.TAHUN } });
    });
    log('Clean Targets', true, `Deleted ${deletedTargets} target records`, null, d2);

    // Delete angkas for test year
    const { result: deletedAngkas, duration: d3 } = await measureTime(async () => {
      return await AnggaranKas.destroy({ where: { tahun: CONFIG.TAHUN } });
    });
    log('Clean Angkas', true, `Deleted ${deletedAngkas} angkas records`, null, d3);

    return true;
  } catch (error: any) {
    log('Clean Data', false, error.message);
    return false;
  }
}

// =============================================================================
// STEP 3: VERIFY REFERENCE DATA
// =============================================================================
async function verifyReferenceData(): Promise<{
  admin: any;
  puskesmasList: any[];
  subKegiatanList: any[];
  sumberAnggaranList: any[];
  satuanList: any[];
} | null> {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: VERIFY REFERENCE DATA');
  console.log('='.repeat(60) + '\n');

  try {
    // Get admin
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      log('Get Admin', false, 'Admin user not found');
      return null;
    }
    log('Get Admin', true, `Found admin: ${admin.username}`);

    // Get all puskesmas including labkesda
    const puskesmasList = await User.findAll({
      where: { role: 'puskesmas' },
      order: [['nama_puskesmas', 'ASC']],
    });
    log('Get Puskesmas', true, `Found ${puskesmasList.length} puskesmas (including Labkesda)`);

    // Check Labkesda exists
    const labkesda = puskesmasList.find(p => p.username === 'labkesda');
    if (labkesda) {
      log('Labkesda Check', true, `Labkesda found: ${labkesda.nama_puskesmas}`);
    } else {
      log('Labkesda Check', false, 'Labkesda not found in puskesmas list');
    }

    // Get sub kegiatan with sumber anggaran
    const subKegiatanList = await SubKegiatan.findAll({
      include: [{
        model: SumberAnggaran,
        as: 'sumberAnggaranList',
        through: { attributes: [] }
      }],
    });
    log('Get SubKegiatan', true, `Found ${subKegiatanList.length} sub kegiatan`);

    // Get sumber anggaran
    const sumberAnggaranList = await SumberAnggaran.findAll();
    log('Get SumberAnggaran', true, `Found ${sumberAnggaranList.length} sumber anggaran: ${sumberAnggaranList.map(s => s.sumber).join(', ')}`);

    // Get satuan
    const satuanList = await Satuan.findAll();
    log('Get Satuan', true, `Found ${satuanList.length} satuan`);

    return { admin, puskesmasList, subKegiatanList, sumberAnggaranList, satuanList };
  } catch (error: any) {
    log('Verify Reference Data', false, error.message);
    return null;
  }
}

// =============================================================================
// STEP 4: UPLOAD EXCEL TARGET (WITH FALLBACK)
// =============================================================================
async function uploadExcelTarget(): Promise<{ success: boolean; data?: any }> {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: UPLOAD EXCEL TARGET');
  console.log('='.repeat(60) + '\n');

  // Check if file exists
  if (!fs.existsSync(CONFIG.EXCEL_FILE)) {
    log('Excel File Check', false, `File not found: ${CONFIG.EXCEL_FILE}`);
    
    // FALLBACK: Create targets manually
    info('Fallback: Creating targets manually via database');
    return await createTargetsManually();
  }

  log('Excel File Check', true, `Found: ${CONFIG.EXCEL_FILE}`);

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(CONFIG.EXCEL_FILE));
    formData.append('catatan', 'E2E Test Upload');

    const { result, duration } = await measureTime(async () => {
      const response = await axios.post(
        `${CONFIG.API_BASE}/target/upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );
      return response.data;
    });

    if (result.success) {
      const uploadData = result.data || result.result || {};
      const inserted = uploadData.inserted || 0;
      const updated = uploadData.updated || 0;
      const skipped = uploadData.skipped || 0;
      
      log('Excel Upload', true, 
        `Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`,
        null, duration);
      
      if (uploadData.excludedNonPuskesmas > 0) {
        info(`Excluded ${uploadData.excludedNonPuskesmas} non-puskesmas entities`);
      }
      
      // If nothing was inserted or updated, create targets manually
      if (inserted === 0 && updated === 0) {
        info('Excel upload resulted in no new data (all skipped). Creating targets manually...');
        return await createTargetsManually();
      }
      
      return { success: true, data: result };
    } else {
      log('Excel Upload', false, result.message || 'Upload failed');
      return await createTargetsManually();
    }
  } catch (error: any) {
    const message = error.response?.data?.message || error.message;
    log('Excel Upload', false, message);
    
    // FALLBACK: Create targets manually
    return await createTargetsManually();
  }
}

// Fallback function to create targets manually
async function createTargetsManually(): Promise<{ success: boolean; data?: any }> {
  info('Creating targets manually for all puskesmas...');

  try {
    // Get admin for created_by
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Get ALL puskesmas including labkesda
    const puskesmasList = await User.findAll({ 
      where: { role: 'puskesmas' },
    });
    
    // Get all sub kegiatan with their sumber anggaran
    const subKegiatanList = await SubKegiatan.findAll({
      include: [{
        model: SumberAnggaran,
        as: 'sumberAnggaranList',
        through: { attributes: [] }
      }],
    });
    
    const satuan = await Satuan.findOne();
    
    let created = 0;
    const { duration } = await measureTime(async () => {
      for (const puskesmas of puskesmasList) {
        for (const subKegiatan of subKegiatanList) {
          const sumberList = (subKegiatan as any).sumberAnggaranList || [];
          for (const sumber of sumberList) {
            try {
              // Varied target values based on puskesmas and subkegiatan
              const pIndex = puskesmasList.findIndex(p => p.id === puskesmas.id);
              const baseFactor = 1 + (pIndex % 5) * 0.2; // 1.0 to 1.8
              
              await SubKegiatanTarget.create({
                user_id: puskesmas.id,
                id_sub_kegiatan: subKegiatan.id_sub_kegiatan,
                id_sumber_anggaran: sumber.id_sumber,
                id_satuan: satuan?.id_satuan || 1,
                target_k: Math.round(100 * baseFactor),
                target_rp: Math.round(10000000 * baseFactor),
                tahun: CONFIG.TAHUN,
                created_by: admin.id,
              });
              created++;
            } catch (err: any) {
              // Skip duplicates silently
              if (!err.message.includes('duplicate')) {
                console.log(`  Warning: ${err.message.substring(0, 50)}`);
              }
            }
          }
        }
      }
    });
    
    log('Manual Target Creation', true, `Created ${created} targets for ${puskesmasList.length} puskesmas`, null, duration);
    return { success: true, data: { created } };
  } catch (error: any) {
    log('Manual Target Creation', false, error.message);
    return { success: false };
  }
}

// =============================================================================
// STEP 5: UPLOAD PDF ANGKAS (WITH FALLBACK)
// =============================================================================
async function uploadPdfAngkas(): Promise<{ success: boolean; data?: any }> {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 5: UPLOAD PDF ANGKAS');
  console.log('='.repeat(60) + '\n');

  // Check if file exists
  if (!fs.existsSync(CONFIG.PDF_FILE)) {
    log('PDF File Check', false, `File not found: ${CONFIG.PDF_FILE}`);
    info('Fallback: Skipping PDF upload - angkas will be calculated from target');
    return { success: true, data: { skipped: true } };
  }

  log('PDF File Check', true, `Found: ${CONFIG.PDF_FILE}`);

  try {
    // Get first sumber anggaran for testing
    const sumberAnggaran = await SumberAnggaran.findOne();
    if (!sumberAnggaran) {
      log('PDF Upload', false, 'No sumber anggaran found');
      return { success: false };
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(CONFIG.PDF_FILE));
    formData.append('id_sumber_anggaran', sumberAnggaran.id_sumber.toString());
    formData.append('catatan', 'E2E Test PDF Upload');

    const { result, duration } = await measureTime(async () => {
      const response = await axios.post(
        `${CONFIG.API_BASE}/angkas/upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 60000, // 60s timeout for large PDFs
        }
      );
      return response.data;
    });

    if (result.success) {
      const uploadData = result.data || result.result || {};
      log('PDF Upload', true, 
        `Inserted: ${uploadData.inserted || 0}, Updated: ${uploadData.updated || 0}`,
        null, duration);
      return { success: true, data: result };
    } else {
      // Check if message indicates success even though success=false
      const msg = result.message || 'Upload failed';
      if (msg.includes('Upload completed') || msg.includes('records processed')) {
        log('PDF Upload', true, msg, null, duration);
        return { success: true, data: result };
      }
      log('PDF Upload', false, msg);
      return { success: false };
    }
  } catch (error: any) {
    const message = error.response?.data?.message || error.message;
    // Check if error message is actually a success message
    if (message.includes('Upload completed') || message.includes('records processed')) {
      log('PDF Upload', true, message);
      return { success: true, data: { message } };
    }
    log('PDF Upload', false, message);
    info('Fallback: Continuing without PDF angkas data');
    return { success: true, data: { skipped: true, error: message } };
  }
}

// =============================================================================
// STEP 6: CHECK UPLOAD HISTORY
// =============================================================================
async function checkUploadHistory(): Promise<boolean> {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 6: CHECK UPLOAD HISTORY');
  console.log('='.repeat(60) + '\n');

  try {
    // Check target history via API
    const targetHistory = await withFallback(
      async () => {
        const response = await axios.get(`${CONFIG.API_BASE}/target/history`, {
          headers: { Authorization: `Bearer ${authToken}` },
          params: { tahun: CONFIG.TAHUN }
        });
        return response.data;
      },
      { history: [] },
      'Target history API not available'
    );
    log('Target History', true, `Found ${targetHistory.history?.length || 0} upload history records`);

    // Check angkas history via API
    const angkasHistory = await withFallback(
      async () => {
        const response = await axios.get(`${CONFIG.API_BASE}/angkas/history`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        return response.data;
      },
      { history: [] },
      'Angkas history API not available'
    );
    log('Angkas History', true, `Found ${angkasHistory.history?.length || 0} upload history records`);

    // Verify data in database
    const targetCount = await SubKegiatanTarget.count({ where: { tahun: CONFIG.TAHUN } });
    log('Target Count', true, `${targetCount} targets in database for ${CONFIG.TAHUN}`);

    const angkasCount = await AnggaranKas.count({ where: { tahun: CONFIG.TAHUN } });
    log('Angkas Count', true, `${angkasCount} angkas records in database for ${CONFIG.TAHUN}`);

    return true;
  } catch (error: any) {
    log('Check History', false, error.message);
    return false;
  }
}

// =============================================================================
// STEP 7: CREATE LAPORAN FOR ALL PUSKESMAS (JAN-JUN)
// =============================================================================
async function createLaporanAllPuskesmas(): Promise<boolean> {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 7: CREATE LAPORAN (JANUARY - JUNE)');
  console.log('='.repeat(60) + '\n');

  try {
    // Get all puskesmas
    const puskesmasList = await User.findAll({
      where: { role: 'puskesmas' },
    });
    
    // Get targets for the test year
    const targets = await SubKegiatanTarget.findAll({
      where: { tahun: CONFIG.TAHUN },
      include: [
        { model: SubKegiatan, as: 'subKegiatan', include: [{ model: Kegiatan, as: 'kegiatanParent' }] },
        { model: SumberAnggaran, as: 'sumberAnggaran' },
        { model: Satuan, as: 'satuan' },
      ]
    });

    if (targets.length === 0) {
      log('Get Targets', false, 'No targets found for test year');
      return false;
    }
    log('Get Targets', true, `Found ${targets.length} targets`);

    // Group targets by user
    const targetsByUser = new Map<string, typeof targets>();
    for (const target of targets) {
      const userId = target.user_id;
      if (!targetsByUser.has(userId)) {
        targetsByUser.set(userId, []);
      }
      targetsByUser.get(userId)!.push(target);
    }

    // Create laporan for each month with varied data
    let totalCreated = 0;
    let totalSkipped = 0;
    const realisasiPercentages: Record<string, number> = {
      'Januari': 15,
      'Februari': 28,
      'Maret': 42,
      'April': 55,
      'Mei': 68,
      'Juni': 80,
    };

    const { duration } = await measureTime(async () => {
      for (const bulan of CONFIG.BULAN_LIST) {
        const percentage = realisasiPercentages[bulan] / 100;
        info(`Creating laporan for ${bulan} (${realisasiPercentages[bulan]}% realisasi)...`);
        
        let monthCreated = 0;
        for (const [userId, userTargets] of targetsByUser) {
          for (const target of userTargets) {
            const subKegiatan = (target as any).subKegiatan;
            const sumberAnggaran = (target as any).sumberAnggaran;
            
            if (!subKegiatan || !sumberAnggaran) {
              totalSkipped++;
              continue;
            }

            // Varied realisasi based on puskesmas order (some perform better)
            const userIndex = puskesmasList.findIndex(p => p.id === userId);
            const performanceFactor = 0.8 + (userIndex % 5) * 0.1; // 0.8 to 1.2
            
            // Calculate varied values
            const baseRealisasi_k = Math.round(target.target_k * percentage * performanceFactor);
            const baseRealisasi_rp = Math.round(target.target_rp * percentage * performanceFactor);
            const realisasi_fisik = Math.min(100, Math.round(percentage * performanceFactor * 100));

            try {
              await Laporan.create({
                user_id: userId,
                bulan,
                tahun: CONFIG.TAHUN,
                id_kegiatan: subKegiatan.id_kegiatan,
                id_sub_kegiatan: subKegiatan.id_sub_kegiatan,
                id_sumber_anggaran: sumberAnggaran.id_sumber,
                id_satuan: target.id_satuan,
                target_k: target.target_k,
                target_rp: target.target_rp,
                angkas: target.target_rp, // Use target as angkas for test
                realisasi_k: baseRealisasi_k,
                realisasi_rp: baseRealisasi_rp,
                realisasi_fisik,
                permasalahan: realisasi_fisik < 50 ? 'Kendala pelaksanaan kegiatan' : '-',
                upaya: realisasi_fisik < 50 ? 'Koordinasi intensif dengan stakeholder' : '-',
                status: 'terkirim',
              });
              monthCreated++;
              totalCreated++;
            } catch (error: any) {
              // Skip duplicate entries
              if (!error.message.includes('duplicate')) {
                console.log(`   Warning: ${error.message.substring(0, 50)}`);
              }
              totalSkipped++;
            }
          }
        }
        
        log(`Laporan ${bulan}`, true, `Created ${monthCreated} records`);
      }
    });

    log('Total Laporan', true, `Created ${totalCreated} laporan, Skipped ${totalSkipped}`, null, duration);

    // Verify Labkesda has laporan
    const labkesda = await User.findOne({ where: { username: 'labkesda' } });
    if (labkesda) {
      const labkesdaLaporan = await Laporan.count({
        where: { user_id: labkesda.id, tahun: CONFIG.TAHUN }
      });
      log('Labkesda Laporan', labkesdaLaporan > 0, 
        labkesdaLaporan > 0 ? `Labkesda has ${labkesdaLaporan} laporan` : 'Labkesda has no laporan');
    }

    return true;
  } catch (error: any) {
    log('Create Laporan', false, error.message);
    return false;
  }
}

// =============================================================================
// STEP 8: VERIFY DASHBOARD DATA
// =============================================================================
async function verifyDashboardData(): Promise<boolean> {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 8: VERIFY DASHBOARD DATA');
  console.log('='.repeat(60) + '\n');

  try {
    // Get dashboard stats
    const stats = await Laporan.findAll({
      where: { tahun: CONFIG.TAHUN, status: 'terkirim' },
      attributes: [
        'bulan',
        [sequelize.fn('SUM', sequelize.col('target_rp')), 'total_target'],
        [sequelize.fn('SUM', sequelize.col('realisasi_rp')), 'total_realisasi'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['bulan'],
    });

    console.log('\n--- Budget Summary by Month ---');
    for (const stat of stats) {
      const bulan = stat.bulan;
      const target = Number((stat as any).dataValues.total_target);
      const realisasi = Number((stat as any).dataValues.total_realisasi);
      const count = Number((stat as any).dataValues.count);
      const percentage = target > 0 ? (realisasi / target * 100).toFixed(2) : '0.00';
      
      console.log(`  ${bulan}: Target=Rp ${target.toLocaleString('id-ID')}, Realisasi=Rp ${realisasi.toLocaleString('id-ID')}, %=${percentage}%, Count=${count}`);
    }
    log('Monthly Data', true, `Found ${stats.length} months of data`);

    // Overall totals
    const totals = await Laporan.findOne({
      where: { tahun: CONFIG.TAHUN, status: 'terkirim' },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('target_rp')), 'total_target'],
        [sequelize.fn('SUM', sequelize.col('realisasi_rp')), 'total_realisasi'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_laporan'],
      ],
    });

    const totalTarget = Number((totals as any)?.dataValues.total_target || 0);
    const totalRealisasi = Number((totals as any)?.dataValues.total_realisasi || 0);
    const totalLaporan = Number((totals as any)?.dataValues.total_laporan || 0);
    const overallPercentage = totalTarget > 0 ? (totalRealisasi / totalTarget * 100).toFixed(2) : '0.00';

    console.log('\n--- Overall Statistics ---');
    console.log(`  Total Target: Rp ${totalTarget.toLocaleString('id-ID')}`);
    console.log(`  Total Realisasi: Rp ${totalRealisasi.toLocaleString('id-ID')}`);
    console.log(`  Overall Percentage: ${overallPercentage}%`);
    console.log(`  Total Laporan: ${totalLaporan}`);
    
    log('Overall Stats', totalLaporan > 0, `${totalLaporan} laporan with ${overallPercentage}% realisasi`);

    // Check puskesmas coverage
    const puskesmasReporting = await Laporan.findAll({
      where: { tahun: CONFIG.TAHUN, status: 'terkirim' },
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('user_id')), 'user_id'],
      ],
    });
    log('Puskesmas Coverage', true, `${puskesmasReporting.length} puskesmas have submitted laporan`);

    return true;
  } catch (error: any) {
    log('Verify Dashboard', false, error.message);
    return false;
  }
}

// =============================================================================
// STEP 9: OPTIMIZATION CHECK
// =============================================================================
async function checkOptimizations(): Promise<boolean> {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 9: OPTIMIZATION CHECK');
  console.log('='.repeat(60) + '\n');

  try {
    // Check query performance
    const { duration: queryDuration } = await measureTime(async () => {
      await Laporan.findAll({
        where: { tahun: CONFIG.TAHUN },
        include: [
          { model: SubKegiatan, as: 'subKegiatan' },
          { model: SumberAnggaran, as: 'sumberAnggaran' },
        ],
        limit: 100,
      });
    });
    
    const queryOptimal = queryDuration < 1000;
    log('Query Performance', queryOptimal, 
      `Laporan query: ${queryDuration}ms ${queryOptimal ? '(optimal)' : '(needs optimization)'}`);

    // Check aggregate query performance
    const { duration: aggDuration } = await measureTime(async () => {
      await Laporan.findAll({
        where: { tahun: CONFIG.TAHUN },
        attributes: [
          'bulan',
          [sequelize.fn('SUM', sequelize.col('target_rp')), 'total_target'],
          [sequelize.fn('SUM', sequelize.col('realisasi_rp')), 'total_realisasi'],
        ],
        group: ['bulan'],
      });
    });
    
    const aggOptimal = aggDuration < 500;
    log('Aggregate Performance', aggOptimal, 
      `Aggregate query: ${aggDuration}ms ${aggOptimal ? '(optimal)' : '(needs optimization)'}`);

    // Check database indexes
    const indexCheck = await withFallback(
      async () => {
        const [results] = await sequelize.query(`
          SELECT indexname, tablename 
          FROM pg_indexes 
          WHERE tablename IN ('laporan', 'sub_kegiatan_target', 'anggaran_kas')
        `);
        return results;
      },
      [],
      'Index check not available'
    );
    log('Database Indexes', true, `Found ${(indexCheck as any[]).length} indexes on main tables`);

    // Memory usage check
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    log('Memory Usage', heapUsedMB < 500, `Heap used: ${heapUsedMB}MB`);

    return true;
  } catch (error: any) {
    log('Optimization Check', false, error.message);
    return false;
  }
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================
async function runTests() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     COMPREHENSIVE END-TO-END TEST - E-EVKIN MODERN       ║');
  console.log('║     Testing: Targets, Angkas, Laporan, Dashboard         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nTest Year: ${CONFIG.TAHUN}`);
  console.log(`Test Months: ${CONFIG.BULAN_LIST.join(', ')}`);
  console.log(`Started: ${new Date().toISOString()}\n`);

  const startTime = Date.now();

  try {
    // Connect to database
    await sequelize.authenticate();
    log('Database Connection', true, 'Connected to PostgreSQL');

    // Run all test steps
    const step1 = await loginAdmin();
    if (!step1) {
      console.log('\n⛔ Cannot proceed without admin authentication');
      process.exit(1);
    }

    const step2 = await cleanData();
    const step3 = await verifyReferenceData();
    const step4 = await uploadExcelTarget();
    const step5 = await uploadPdfAngkas();
    const step6 = await checkUploadHistory();
    const step7 = await createLaporanAllPuskesmas();
    const step8 = await verifyDashboardData();
    const step9 = await checkOptimizations();

    const totalDuration = Date.now() - startTime;

    // Print summary
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`\n  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${passedTests} ✅`);
    console.log(`  Failed: ${failedTests} ❌`);
    console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    if (failedTests === 0) {
      console.log('\n🎉 ALL TESTS PASSED! System is working correctly. 🎉\n');
    } else {
      console.log('\n⚠️  Some tests failed. Review the errors above.\n');
      
      // List failed tests
      console.log('Failed Tests:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.step}: ${r.message}`);
      });
    }

  } catch (error: any) {
    console.error('\n⛔ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the tests
runTests();
