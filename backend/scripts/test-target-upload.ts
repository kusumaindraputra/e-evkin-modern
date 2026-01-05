import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://127.0.0.1:5000/api';

async function testTargetAnggaranUpload() {
  console.log('=== Testing Target Anggaran Upload ===\n');

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

  // 2. Upload Excel file
  console.log('\n2. Uploading Excel file...');
  const excelPath = path.resolve(__dirname, '../../Rekap_Ver3 (7).xlsx');
  
  if (!fs.existsSync(excelPath)) {
    console.error(`   ✗ File not found: ${excelPath}`);
    process.exit(1);
  }

  const formData = new FormData();
  formData.append('file', fs.createReadStream(excelPath));
  formData.append('catatan', 'Upload test via script');

  try {
    const uploadResponse = await axios.post(`${API_BASE}/target/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('   ✓ Upload completed');
    console.log('\n=== Upload Result ===');
    console.log(JSON.stringify(uploadResponse.data, null, 2));

    // Extract stats
    const result = uploadResponse.data;
    console.log('\n=== Summary ===');
    console.log(`   Success: ${result.data?.success || 'N/A'}`);
    console.log(`   Inserted: ${result.data?.inserted || 'N/A'}`);
    console.log(`   Updated: ${result.data?.updated || 'N/A'}`);
    console.log(`   Skipped: ${result.data?.skipped || 'N/A'}`);
    console.log(`   Failed: ${result.data?.failed || 'N/A'}`);
    console.log(`   New Sub Kegiatan: ${result.data?.createdSubKegiatan || 'N/A'}`);
    console.log(`   New Sumber Dana: ${result.data?.createdSumberAnggaran || 'N/A'}`);
    console.log(`   Excluded (non-puskesmas): ${result.data?.excludedNonPuskesmas || 'N/A'}`);

    if (result.data?.errors && result.data.errors.length > 0) {
      console.log('\n=== Errors (first 10) ===');
      result.data.errors.slice(0, 10).forEach((err: string) => console.log(`   - ${err}`));
    }

  } catch (error: any) {
    console.error('   ✗ Upload failed:', error.response?.data || error.message);
    if (error.response?.data?.errors) {
      console.log('\n=== Errors ===');
      error.response.data.errors.slice(0, 20).forEach((err: string) => console.log(`   - ${err}`));
    }
    process.exit(1);
  }

  // 3. Verify data in database
  console.log('\n3. Verifying data in database...');
  try {
    const targetResponse = await axios.get(`${API_BASE}/target/assigned?tahun=2025`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const targets = targetResponse.data;
    console.log(`   ✓ Found ${targets.length} target records for 2025`);

    // Count unique puskesmas
    const uniquePuskesmas = new Set(targets.map((t: any) => t.user_id));
    console.log(`   ✓ Unique puskesmas with targets: ${uniquePuskesmas.size}`);

  } catch (error: any) {
    console.error('   ✗ Verification failed:', error.response?.data || error.message);
  }

  console.log('\n=== Test Complete ===');
}

testTargetAnggaranUpload().catch(console.error);
