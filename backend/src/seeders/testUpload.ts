/**
 * Test Upload Script for Target Excel and Angkas PDF
 * Usage: node --loader tsx --no-warnings src/seeders/testUpload.ts
 */

import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';
import jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

// Generate admin token
function generateAdminToken() {
  return jwt.sign(
    { id: 'admin_id', role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function uploadExcel() {
  console.log('\n=== Uploading Excel Target File ===');
  
  const filePath = path.resolve(__dirname, '../../docs/Rekap_Ver3 (7).xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error('Excel file not found:', filePath);
    return null;
  }
  
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('catatan', 'Upload via testUpload script');
  
  const token = generateAdminToken();
  
  try {
    const response = await axios.post(`${API_URL}/target/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    
    console.log('Excel Upload Result:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('Excel Upload Error:', error.response?.data || error.message);
    return null;
  }
}

async function uploadPdf(sumberAnggaranId: number = 1) {
  console.log('\n=== Uploading Angkas PDF File ===');
  
  const filePath = path.resolve(__dirname, '../../docs/Angkas Parsial 3 tahun 2025.pdf');
  
  if (!fs.existsSync(filePath)) {
    console.error('PDF file not found:', filePath);
    return null;
  }
  
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('id_sumber_anggaran', sumberAnggaranId.toString());
  
  const token = generateAdminToken();
  
  try {
    const response = await axios.post(`${API_URL}/angkas/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    
    console.log('PDF Upload Result:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('PDF Upload Error:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  // First upload Excel
  const excelResult = await uploadExcel();
  
  // Then upload PDF (sumber anggaran ID 1 = BLUD)
  const pdfResult = await uploadPdf(1);
  
  // Summary
  console.log('\n=== Upload Summary ===');
  
  if (excelResult) {
    console.log('Excel:');
    console.log('  - Inserted:', excelResult.inserted);
    console.log('  - Updated:', excelResult.updated);
    console.log('  - Skipped:', excelResult.skipped);
    console.log('  - Failed:', excelResult.failed);
    console.log('  - Excluded Non-Puskesmas:', excelResult.excludedNonPuskesmas);
    if (excelResult.errors?.length > 0) {
      console.log('  - Errors:', excelResult.errors.slice(0, 10));
    }
  }
  
  if (pdfResult) {
    console.log('PDF:');
    console.log('  - Inserted:', pdfResult.inserted);
    console.log('  - Updated:', pdfResult.updated);
    console.log('  - Skipped:', pdfResult.skipped);
    console.log('  - Failed:', pdfResult.failed);
    console.log('  - Unmatched Puskesmas:', pdfResult.unmatchedPuskesmas);
    console.log('  - Unmatched Sumber Anggaran:', pdfResult.unmatchedSumberAnggaran);
  }
}

main();
