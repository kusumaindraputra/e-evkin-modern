import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://127.0.0.1:5000/api';

async function testAngkasUpload() {
  console.log('=== Testing Angkas PDF Upload ===\n');

  // 1. Login as admin
  console.log('1. Logging in as admin...');
  const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
    username: 'dinkes',
    password: 'dinkes123'
  });

  if (!loginResponse.data.token) {
    console.error('Login failed!');
    process.exit(1);
  }

  const token = loginResponse.data.token;
  console.log('   ✓ Login successful');

  // 2. Upload PDF file
  console.log('\n2. Uploading Angkas PDF file...');
  const pdfPath = path.resolve(__dirname, '../../docs/Angkas Parsial 3 tahun 2025.pdf');
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`   ✗ File not found: ${pdfPath}`);
    process.exit(1);
  }
  
  console.log(`   File: ${pdfPath}`);

  const formData = new FormData();
  formData.append('file', fs.createReadStream(pdfPath));
  formData.append('tahun', '2025');

  try {
    const uploadResponse = await axios.post(`${API_BASE}/angkas/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000 // 2 minutes timeout for large PDF
    });

    console.log('   ✓ Upload completed');
    console.log('\n=== Upload Result ===');
    
    const result = uploadResponse.data;
    console.log(`   Success: ${result.data?.success || 0}`);
    console.log(`   Inserted: ${result.data?.inserted || 0}`);
    console.log(`   Updated: ${result.data?.updated || 0}`);
    console.log(`   Skipped: ${result.data?.skipped || 0}`);
    console.log(`   Failed: ${result.data?.failed || 0}`);
    console.log(`   Created Sumber Anggaran: ${result.data?.createdSumberAnggaran || 0}`);
    
    if (result.data?.detectedSumberAnggaran?.length > 0) {
      console.log('\n=== Detected Sumber Anggaran ===');
      result.data.detectedSumberAnggaran.forEach((s: any) => console.log(`   - ${s.kode}: ${s.nama}`));
    }

    if (result.data?.unmatchedPuskesmas?.length > 0) {
      console.log('\n=== Unmatched Puskesmas (first 10) ===');
      result.data.unmatchedPuskesmas.slice(0, 10).forEach((p: string) => console.log(`   - ${p}`));
      console.log(`   Total unmatched: ${result.data.unmatchedPuskesmas.length}`);
    }

    if (result.data?.unmatchedSumberAnggaran?.length > 0) {
      console.log('\n=== Unmatched Sumber Anggaran ===');
      result.data.unmatchedSumberAnggaran.forEach((s: string) => console.log(`   - ${s}`));
    }

    if (result.data?.errors && result.data.errors.length > 0) {
      console.log('\n=== Errors (first 10) ===');
      result.data.errors.slice(0, 10).forEach((err: string) => console.log(`   - ${err}`));
    }

    if (result.data?.successList && result.data.successList.length > 0) {
      console.log('\n=== Sample Success Entries (first 5) ===');
      result.data.successList.slice(0, 5).forEach((s: any) => {
        console.log(`   - ${s.puskesmas || 'Unknown'}: ${s.kodeRekening || s.subKegiatan || 'Unknown'} - Rp ${s.nilai?.toLocaleString() || '0'}`);
      });
    }

  } catch (error: any) {
    console.error('   ✗ Upload failed:', error.response?.data?.error || error.message);
    if (error.response?.data?.errors) {
      console.log('\n=== Errors ===');
      error.response.data.errors.slice(0, 20).forEach((err: string) => console.log(`   - ${err}`));
    }
    process.exit(1);
  }

  // 3. Verify data in database
  console.log('\n3. Verifying angkas data in database...');
  try {
    // Get angkas data for bulan=3 (should match the uploaded PDF)
    const angkasResponse = await axios.get(`${API_BASE}/angkas/by-sub-kegiatan?tahun=2025&bulan=3`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const angkasData = angkasResponse.data;
    if (Array.isArray(angkasData)) {
      console.log(`   ✓ Found ${angkasData.length} angkas records for bulan 3, tahun 2025`);
      
      // Count unique puskesmas
      const uniquePuskesmas = new Set(angkasData.map((a: any) => a.user_id));
      console.log(`   ✓ Unique puskesmas with angkas: ${uniquePuskesmas.size}`);
    } else {
      console.log('   ✓ Angkas data retrieved (non-array format)');
    }

  } catch (error: any) {
    console.error('   ✗ Verification failed:', error.response?.data?.error || error.message);
  }

  console.log('\n=== Test Complete ===');
}

testAngkasUpload().catch(console.error);
