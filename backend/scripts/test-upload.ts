/**
 * Test script for angkas upload endpoint
 * Uses existing running server
 */

import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';

async function testUpload() {
  const pdfPath = path.join(__dirname, '../../docs/Angkas Parsial 3 tahun 2025.pdf');
  
  if (!fs.existsSync(pdfPath)) {
    console.error('❌ PDF file not found:', pdfPath);
    return;
  }

  // First get a fresh token
  console.log('🔑 Getting auth token...');
  const loginResp = await axios.post('http://localhost:5000/api/auth/login', {
    username: 'dinkes',
    password: 'dinkes123'
  });
  const token = loginResp.data.token;
  console.log('✅ Got token');

  const form = new FormData();
  form.append('file', fs.createReadStream(pdfPath));
  form.append('tahun', '2025');

  console.log('📤 Uploading PDF to /api/angkas/upload...');
  console.log('📂 File:', pdfPath);

  try {
    const response = await axios.post('http://localhost:5000/api/angkas/upload', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log('\n✅ Upload successful!');
    console.log('\n📊 Summary:');
    console.log('  Message:', response.data.message);
    console.log('  Parsed Puskesmas:', response.data.parsedPuskesmas);
    console.log('  Tahun:', response.data.tahun);
    
    const result = response.data.result;
    console.log('\n📈 Results:');
    console.log('  Success:', result.success);
    console.log('  Inserted:', result.inserted);
    console.log('  Updated:', result.updated);
    console.log('  Skipped:', result.skipped);
    console.log('  Failed:', result.failed);
    
    if (result.unmatchedPuskesmas?.length > 0) {
      console.log('\n❌ Unmatched Puskesmas:');
      result.unmatchedPuskesmas.forEach((name: string) => console.log('  -', name));
    }
    
    if (result.unmatchedSumberAnggaran?.length > 0) {
      console.log('\n❌ Unmatched Sumber Anggaran:');
      result.unmatchedSumberAnggaran.forEach((name: string) => console.log('  -', name));
    }
    
    if (result.errors?.length > 0) {
      console.log('\n⚠️ Errors (first 5):');
      result.errors.slice(0, 5).forEach((err: any) => {
        console.log(`  - ${err.puskesmas}: ${err.error}`);
      });
    }

    console.log('\n📋 Detected Sumber Anggaran:');
    result.detectedSumberAnggaran?.forEach((s: any) => {
      console.log(`  - ${s.kode}: ${s.nama}`);
    });

  } catch (error: any) {
    console.error('\n❌ Upload failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testUpload();
