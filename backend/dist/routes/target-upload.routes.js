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
// Helper function to check if entity should be excluded from errors
// Only Puskesmas and Labkesda are valid - everything else is excluded
function isExcludedEntity(puskesmasName) {
    const normalizedName = puskesmasName.toLowerCase();
    // Valid entities that should NOT be excluded
    const validPrefixes = ['puskesmas', 'puskemas']; // Include typo variant
    const validNames = ['laboratorium kesehatan daerah', 'labkesda'];
    // Check if it's a valid Puskesmas
    for (const prefix of validPrefixes) {
        if (normalizedName.startsWith(prefix)) {
            return false; // Don't exclude - it's a Puskesmas
        }
    }
    // Check if it's Labkesda
    for (const name of validNames) {
        if (normalizedName.includes(name)) {
            return false; // Don't exclude - it's Labkesda
        }
    }
    // Everything else should be excluded
    return true;
}
// POST /api/target/upload - Upload Excel file to bulk import targets
router.post('/upload', auth_1.authenticate, authorize_1.authorizeAdmin, upload.single('file'), async (req, res) => {
    try {
        const adminId = req.user.id;
        const catatan = req.body.catatan || null; // Catatan manual dari user
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
            createdSumberAnggaran: 0,
            failed: 0,
            excludedNonPuskesmas: 0,
            errors: [],
            successList: [],
        };
        // OPTIMIZATION: Pre-fetch all reference data before processing loop
        // This eliminates N+1 queries for User, SubKegiatan, SumberAnggaran lookups
        // Pre-fetch all puskesmas users with kode_sub_unit
        const allPuskesmasUsers = await models_1.User.findAll({
            where: { role: 'puskesmas' },
            attributes: ['id', 'username', 'kode_sub_unit', 'nama_puskesmas'],
        });
        // Build lookup maps for fast access
        const userByKodeSubUnit = new Map();
        const userByUsername = new Map();
        const userByNamaPuskesmas = new Map();
        for (const u of allPuskesmasUsers) {
            if (u.kode_sub_unit)
                userByKodeSubUnit.set(u.kode_sub_unit, u);
            if (u.username)
                userByUsername.set(u.username.toLowerCase(), u);
            if (u.nama_puskesmas)
                userByNamaPuskesmas.set(u.nama_puskesmas.toLowerCase(), u);
        }
        // Pre-fetch all SubKegiatan
        const allSubKegiatan = await models_1.SubKegiatan.findAll({
            attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan'],
        });
        const subKegiatanByKode = new Map();
        for (const sk of allSubKegiatan) {
            if (sk.kode_sub)
                subKegiatanByKode.set(sk.kode_sub, sk);
        }
        // Pre-fetch all SumberAnggaran
        const allSumberAnggaran = await models_1.SumberAnggaran.findAll({
            attributes: ['id_sumber', 'sumber'],
        });
        const sumberAnggaranByNama = new Map();
        const sumberAnggaranByNamaLower = new Map();
        for (const sa of allSumberAnggaran) {
            sumberAnggaranByNama.set(sa.sumber, sa);
            sumberAnggaranByNamaLower.set(sa.sumber.toLowerCase(), sa);
        }
        // Extract unique tahun values from data first
        const tahunValues = [...new Set(data.map(row => row.TAHUN))];
        // Pre-fetch all existing targets for all years in the upload
        const allExistingTargets = await models_1.SubKegiatanTarget.findAll({
            where: {
                tahun: { [sequelize_1.Op.in]: tahunValues },
                bulan: null,
            },
            order: [['created_at', 'DESC']],
        });
        // Build lookup map: user_id + id_sub_kegiatan + id_sumber_anggaran + tahun -> latest target
        const existingTargetMap = new Map();
        for (const target of allExistingTargets) {
            const key = `${target.user_id}_${target.id_sub_kegiatan}_${target.id_sumber_anggaran}_${target.tahun}`;
            if (!existingTargetMap.has(key)) {
                existingTargetMap.set(key, target);
            }
        }
        // Group by kode_sub_unit + sub kegiatan + sumber dana + tahun
        const grouped = new Map();
        data.forEach((row, index) => {
            const key = `${row['KODE SUB UNIT']}_${row['KODE SUB KEGIATAN']}_${row['KODE SUMBER DANA']}_${row.TAHUN}`;
            if (!grouped.has(key)) {
                grouped.set(key, {
                    kodeSubUnit: row['KODE SUB UNIT'],
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
        // Process each grouped target
        for (const [_key, group] of grouped) {
            try {
                // OPTIMIZED: Find puskesmas using pre-fetched maps (no database query)
                let puskesmas = null;
                // Primary: by kode_sub_unit
                if (group.kodeSubUnit) {
                    puskesmas = userByKodeSubUnit.get(group.kodeSubUnit) || null;
                }
                // Fallback: Handle specific mapping for "Laboratorium Kesehatan Daerah" -> "labkesda"
                if (!puskesmas && group.puskesmas === 'Laboratorium Kesehatan Daerah') {
                    puskesmas = userByUsername.get('labkesda') || null;
                }
                // Fallback: try by nama_puskesmas (case-insensitive)
                if (!puskesmas) {
                    const searchName = group.puskesmas.replace(/^Puskesmas\s+|^Puskemas\s+/i, '').toLowerCase();
                    puskesmas = userByNamaPuskesmas.get(searchName) || null;
                }
                if (!puskesmas) {
                    // Check if this is a non-Puskesmas entity that should be excluded
                    if (isExcludedEntity(group.puskesmas)) {
                        result.excludedNonPuskesmas++;
                        continue;
                    }
                    result.failed++;
                    result.errors.push({
                        row: group.rows[0],
                        puskesmas: group.puskesmas,
                        subKegiatan: group.subKegiatanNama,
                        error: `Puskesmas "${group.puskesmas}" (kode: ${group.kodeSubUnit}) tidak ditemukan`,
                    });
                    continue;
                }
                // OPTIMIZED: Find sub kegiatan using pre-fetched map
                let subKegiatan = subKegiatanByKode.get(group.subKegiatanKode) || null;
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
                    // Add to cache for future iterations
                    subKegiatanByKode.set(group.subKegiatanKode, subKegiatan);
                    result.createdSubKegiatan++;
                }
                // OPTIMIZED: Find sumber anggaran using pre-fetched map
                const sumberDanaNamaTrimmed = group.sumberDanaNama.trim();
                let sumberAnggaran = sumberAnggaranByNama.get(sumberDanaNamaTrimmed) || null;
                // If not found, try case-insensitive search
                if (!sumberAnggaran) {
                    sumberAnggaran = sumberAnggaranByNamaLower.get(sumberDanaNamaTrimmed.toLowerCase()) || null;
                }
                // If still not found, create new sumber anggaran
                if (!sumberAnggaran) {
                    sumberAnggaran = await models_1.SumberAnggaran.create({
                        sumber: sumberDanaNamaTrimmed,
                    });
                    // Add to cache for future iterations
                    sumberAnggaranByNama.set(sumberAnggaran.sumber, sumberAnggaran);
                    sumberAnggaranByNamaLower.set(sumberAnggaran.sumber.toLowerCase(), sumberAnggaran);
                    result.createdSumberAnggaran++;
                }
                // OPTIMIZED: Check if target already exists using pre-fetched map
                const targetKey = `${puskesmas.id}_${subKegiatan.id_sub_kegiatan}_${sumberAnggaran.id_sumber}_${group.tahun}`;
                const existingTarget = existingTargetMap.get(targetKey) || null;
                if (existingTarget) {
                    // Check if target_rp is the same, skip if no change needed
                    // Note: BIGINT dari database dikembalikan sebagai string oleh Sequelize
                    const existingTargetRp = Number(existingTarget.target_rp);
                    const newTargetRp = Number(group.totalPagu);
                    if (existingTargetRp === newTargetRp) {
                        result.skipped++;
                        continue; // Skip this iteration
                    }
                    // INSERT new record for history tracking (instead of UPDATE)
                    // This preserves the old value and creates a new entry
                    // Preserve target_k and id_satuan from existing record (only update target_rp)
                    const newTarget = await models_1.SubKegiatanTarget.create({
                        user_id: puskesmas.id,
                        id_sub_kegiatan: subKegiatan.id_sub_kegiatan,
                        id_sumber_anggaran: sumberAnggaran.id_sumber,
                        tahun: group.tahun,
                        bulan: null,
                        target_k: existingTarget.target_k, // Preserve existing target_k
                        target_rp: group.totalPagu,
                        id_satuan: existingTarget.id_satuan, // Preserve existing satuan
                        created_by: adminId,
                        catatan: catatan,
                    });
                    // Update cache with new target (for potential future iterations in same batch)
                    existingTargetMap.set(targetKey, newTarget);
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
                    // INSERT new target (first entry)
                    // Set target_k=0 and id_satuan=null - admin must set via Target Kinerja page
                    const newTarget = await models_1.SubKegiatanTarget.create({
                        user_id: puskesmas.id,
                        id_sub_kegiatan: subKegiatan.id_sub_kegiatan,
                        id_sumber_anggaran: sumberAnggaran.id_sumber,
                        tahun: group.tahun,
                        bulan: null,
                        target_k: 0, // Default 0, must be set in Target Kinerja page
                        target_rp: group.totalPagu,
                        id_satuan: null, // Null, must be selected in Target Kinerja page
                        created_by: adminId,
                        catatan: catatan,
                    });
                    // Add to cache for potential future iterations in same batch
                    existingTargetMap.set(targetKey, newTarget);
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
            message: `Upload selesai. Berhasil: ${result.success}, Skipped: ${result.skipped}, Gagal: ${result.failed}, Sub Kegiatan Baru: ${result.createdSubKegiatan}, Sumber Dana Baru: ${result.createdSumberAnggaran}${result.excludedNonPuskesmas > 0 ? `, Excluded (bukan Puskesmas): ${result.excludedNonPuskesmas}` : ''}`,
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