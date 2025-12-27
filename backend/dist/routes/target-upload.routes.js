"use strict";
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
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const XLSX = __importStar(require("xlsx"));
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const router = (0, express_1.Router)();
// Configure multer for memory storage
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// POST /api/target/upload - Upload Excel file to bulk import targets
router.post('/upload', auth_1.authenticate, authorize_1.authorizeAdmin, upload.single('file'), async (req, res) => {
    try {
        const adminId = req.user.id;
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'File tidak ditemukan',
            });
        }
        // Parse Excel file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        if (data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'File Excel kosong',
            });
        }
        const result = {
            success: 0,
            inserted: 0,
            updated: 0,
            skipped: 0,
            createdSubKegiatan: 0,
            failed: 0,
            errors: [],
            successList: [],
        };
        // Get default satuan "Dokumen" (id = 2)
        const defaultSatuan = await models_1.Satuan.findOne({ where: { satuannya: 'Dokumen' } });
        const defaultSatuanId = defaultSatuan?.id_satuan || 2;
        // Group by puskesmas + sub kegiatan + sumber dana + tahun
        const grouped = new Map();
        data.forEach((row, index) => {
            const key = `${row['NAMA SUB UNIT']}_${row['KODE SUB KEGIATAN']}_${row['KODE SUMBER DANA']}_${row.TAHUN}`;
            if (!grouped.has(key)) {
                grouped.set(key, {
                    puskesmas: row['NAMA SUB UNIT'],
                    subKegiatanKode: row['KODE SUB KEGIATAN'],
                    subKegiatanNama: row['NAMA SUB KEGIATAN'],
                    sumberDanaKode: row['KODE SUMBER DANA'],
                    sumberDanaNama: row['NAMA SUMBER DANA'],
                    tahun: row.TAHUN,
                    totalPagu: 0,
                    rows: [],
                });
            }
            const group = grouped.get(key);
            group.totalPagu += row.PAGU || 0;
            group.rows.push(index + 2); // +2 karena Excel row 1 = header, index 0 = row 2
        });
        console.log(`📊 Found ${grouped.size} unique targets to process from ${data.length} rows`);
        // Process each grouped target
        for (const [key, group] of grouped) {
            try {
                // Find puskesmas by nama
                // Handle specific mapping for "Laboratorium Kesehatan Daerah" -> "labkesda"
                let puskesmas = null;
                if (group.puskesmas === 'Laboratorium Kesehatan Daerah') {
                    puskesmas = await models_1.User.findOne({
                        where: {
                            username: 'labkesda',
                            role: 'puskesmas',
                        },
                    });
                }
                // Handle prefix "Puskesmas" in Excel vs DB without prefix
                if (!puskesmas) {
                    puskesmas = await models_1.User.findOne({
                        where: {
                            nama: group.puskesmas,
                            role: 'puskesmas',
                        },
                    });
                }
                // If not found, try without "Puskesmas" prefix
                if (!puskesmas && group.puskesmas.startsWith('Puskesmas ')) {
                    const namaWithoutPrefix = group.puskesmas.replace('Puskesmas ', '');
                    puskesmas = await models_1.User.findOne({
                        where: {
                            nama: namaWithoutPrefix,
                            role: 'puskesmas',
                        },
                    });
                }
                // Handle typo "Puskemas" instead of "Puskesmas"
                if (!puskesmas && group.puskesmas.startsWith('Puskemas ')) {
                    const namaWithoutPrefix = group.puskesmas.replace('Puskemas ', '');
                    puskesmas = await models_1.User.findOne({
                        where: {
                            nama: namaWithoutPrefix,
                            role: 'puskesmas',
                        },
                    });
                }
                // Handle case differences like "Kota batu" vs "Kota Batu"
                if (!puskesmas) {
                    const searchName = group.puskesmas.replace(/^Puskesmas\s+|^Puskemas\s+/i, '');
                    puskesmas = await models_1.User.findOne({
                        where: {
                            nama: { [sequelize_1.Op.iLike]: searchName }, // Case-insensitive search
                            role: 'puskesmas',
                        },
                    });
                }
                // Handle space differences like "Karya Mekar" vs "Karyamekar"
                if (!puskesmas) {
                    const searchName = group.puskesmas
                        .replace(/^Puskesmas\s+|^Puskemas\s+/i, '')
                        .replace(/\s+/g, ''); // Remove all spaces
                    puskesmas = await models_1.User.findOne({
                        where: {
                            nama: { [sequelize_1.Op.iLike]: searchName },
                            role: 'puskesmas',
                        },
                    });
                }
                // Last resort: try to match DB names that contain the search term
                if (!puskesmas) {
                    const searchName = group.puskesmas
                        .replace(/^Puskesmas\s+|^Puskemas\s+/i, '')
                        .replace(/\s+/g, '');
                    puskesmas = await models_1.User.findOne({
                        where: {
                            nama: { [sequelize_1.Op.iLike]: `%${searchName}%` },
                            role: 'puskesmas',
                        },
                    });
                }
                if (!puskesmas) {
                    result.failed++;
                    result.errors.push({
                        row: group.rows[0],
                        puskesmas: group.puskesmas,
                        subKegiatan: group.subKegiatanNama,
                        error: `Puskesmas "${group.puskesmas}" tidak ditemukan`,
                    });
                    continue;
                }
                // Find sub kegiatan by kode
                let subKegiatan = await models_1.SubKegiatan.findOne({
                    where: { kode_sub: group.subKegiatanKode },
                });
                if (!subKegiatan) {
                    // Insert new sub kegiatan if not found
                    // First, find or create a default parent kegiatan
                    let parentKegiatan = await models_1.Kegiatan.findOne({
                        where: { kode: '99' }, // Default parent kegiatan
                    });
                    if (!parentKegiatan) {
                        // Create default parent kegiatan
                        parentKegiatan = await models_1.Kegiatan.create({
                            kode: '99',
                            kegiatan: 'Kegiatan Lainnya (Auto-generated)',
                            id_uraian: 1, // Default uraian
                        });
                    }
                    // Create new sub kegiatan
                    subKegiatan = await models_1.SubKegiatan.create({
                        kode_sub: group.subKegiatanKode,
                        kegiatan: group.subKegiatanNama,
                        id_kegiatan: parentKegiatan.id_kegiatan,
                        indikator_kinerja: 'Auto-generated dari upload Excel',
                    });
                    result.createdSubKegiatan++;
                    console.log(`✅ Created new sub kegiatan: ${group.subKegiatanKode} - ${group.subKegiatanNama}`);
                }
                // Find sumber anggaran - need to map KODE SUMBER DANA to our table
                // For now, try to match by nama
                const sumberAnggaran = await models_1.SumberAnggaran.findOne({
                    where: { sumber: group.sumberDanaNama },
                });
                if (!sumberAnggaran) {
                    result.failed++;
                    result.errors.push({
                        row: group.rows[0],
                        puskesmas: group.puskesmas,
                        subKegiatan: group.subKegiatanNama,
                        error: `Sumber dana "${group.sumberDanaNama}" tidak ditemukan`,
                    });
                    continue;
                }
                // Check if target already exists
                const existingTarget = await models_1.SubKegiatanTarget.findOne({
                    where: {
                        user_id: puskesmas.id,
                        id_sub_kegiatan: subKegiatan.id_sub_kegiatan,
                        id_sumber_anggaran: sumberAnggaran.id_sumber,
                        tahun: group.tahun,
                        bulan: null,
                    },
                });
                if (existingTarget) {
                    // Check if target_rp is the same, skip if no change needed
                    if (existingTarget.target_rp === group.totalPagu) {
                        result.skipped++;
                        console.log(`⏭️  Skipped (same value) ${group.puskesmas} - ${group.subKegiatanKode}: ${group.totalPagu}`);
                        continue; // Skip this iteration
                    }
                    // UPDATE existing target
                    await existingTarget.update({
                        target_k: 10,
                        target_rp: group.totalPagu,
                        id_satuan: defaultSatuanId,
                        created_by: adminId,
                    });
                    result.updated++;
                    result.successList.push({
                        type: 'updated',
                        puskesmas: group.puskesmas,
                        subKegiatan: `${group.subKegiatanKode} - ${group.subKegiatanNama}`,
                        sumberDana: group.sumberDanaNama,
                        tahun: group.tahun,
                        target_rp: group.totalPagu,
                    });
                }
                else {
                    // INSERT new target
                    await models_1.SubKegiatanTarget.create({
                        user_id: puskesmas.id,
                        id_sub_kegiatan: subKegiatan.id_sub_kegiatan,
                        id_sumber_anggaran: sumberAnggaran.id_sumber,
                        tahun: group.tahun,
                        bulan: null,
                        target_k: 10,
                        target_rp: group.totalPagu,
                        id_satuan: defaultSatuanId,
                        created_by: adminId,
                    });
                    result.inserted++;
                    result.successList.push({
                        type: 'inserted',
                        puskesmas: group.puskesmas,
                        subKegiatan: `${group.subKegiatanKode} - ${group.subKegiatanNama}`,
                        sumberDana: group.sumberDanaNama,
                        tahun: group.tahun,
                        target_rp: group.totalPagu,
                    });
                }
                result.success++;
            }
            catch (error) {
                result.failed++;
                result.errors.push({
                    row: group.rows[0],
                    puskesmas: group.puskesmas,
                    subKegiatan: group.subKegiatanNama,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        return res.json({
            success: true,
            message: `Upload selesai. Berhasil: ${result.success}, Skipped: ${result.skipped}, Gagal: ${result.failed}, Sub Kegiatan Baru: ${result.createdSubKegiatan}`,
            data: result,
        });
    }
    catch (error) {
        console.error('Error uploading targets:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal upload file',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=target-upload.routes.js.map