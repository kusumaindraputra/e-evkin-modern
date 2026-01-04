"use strict";
/**
 * Test Upload Script for Target Excel and Angkas PDF
 * Usage: node --loader tsx --no-warnings src/seeders/testUpload.ts
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
// Generate admin token
function generateAdminToken() {
    return jsonwebtoken_1.default.sign({ id: 'admin_id', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
}
async function uploadExcel() {
    console.log('\n=== Uploading Excel Target File ===');
    const filePath = path.resolve(__dirname, '../../docs/Rekap_Ver3 (7).xlsx');
    if (!fs.existsSync(filePath)) {
        console.error('Excel file not found:', filePath);
        return null;
    }
    const form = new form_data_1.default();
    form.append('file', fs.createReadStream(filePath));
    form.append('catatan', 'Upload via testUpload script');
    const token = generateAdminToken();
    try {
        const response = await axios_1.default.post(`${API_URL}/target/upload`, form, {
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
    }
    catch (error) {
        console.error('Excel Upload Error:', error.response?.data || error.message);
        return null;
    }
}
async function uploadPdf(sumberAnggaranId = 1) {
    console.log('\n=== Uploading Angkas PDF File ===');
    const filePath = path.resolve(__dirname, '../../docs/Angkas Parsial 3 tahun 2025.pdf');
    if (!fs.existsSync(filePath)) {
        console.error('PDF file not found:', filePath);
        return null;
    }
    const form = new form_data_1.default();
    form.append('file', fs.createReadStream(filePath));
    form.append('id_sumber_anggaran', sumberAnggaranId.toString());
    const token = generateAdminToken();
    try {
        const response = await axios_1.default.post(`${API_URL}/angkas/upload`, form, {
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
    }
    catch (error) {
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
//# sourceMappingURL=testUpload.js.map