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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ExcelJS = __importStar(require("exceljs"));
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Export laporan to Excel for puskesmas
router.get('/laporan', auth_1.authenticate, async (req, res) => {
    try {
        const bulan = req.query.bulan;
        const tahun = req.query.tahun ? parseInt(req.query.tahun) : new Date().getFullYear();
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        // Build where clause
        const where = {
            user_id: userId,
        };
        if (bulan)
            where.bulan = bulan;
        if (tahun)
            where.tahun = tahun;
        // Fetch laporan data
        const laporanData = await models_1.Laporan.findAll({
            where,
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['id', 'username', 'nama', 'nama_puskesmas']
                },
                {
                    model: models_1.SumberAnggaran,
                    as: 'sumberAnggaran',
                    attributes: ['id_sumber', 'sumber']
                },
                {
                    model: models_1.Satuan,
                    as: 'satuan',
                    attributes: ['id_satuan', 'satuannya']
                },
                {
                    model: models_1.SubKegiatan,
                    as: 'subKegiatan',
                    attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan', 'indikator_kinerja'],
                    include: [{
                            model: models_1.Kegiatan,
                            as: 'kegiatanParent',
                            attributes: ['id_kegiatan', 'kode', 'kegiatan']
                        }]
                }
            ],
            order: [['id_kegiatan', 'ASC'], ['id_sub_kegiatan', 'ASC']]
        });
        if (laporanData.length === 0) {
            res.status(404).json({ message: 'Tidak ada data laporan untuk di-export' });
            return;
        }
        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Laporan Kinerja');
        // Get user info
        const firstLaporan = laporanData[0];
        const user = firstLaporan.user;
        const puskesmas = user?.nama_puskesmas || 'N/A';
        // Add title
        worksheet.mergeCells('A1:P1');
        worksheet.getCell('A1').value = `Laporan Evaluasi Kinerja Bulan ${bulan || 'Semua'} Tahun ${tahun}`;
        worksheet.getCell('A1').font = { size: 14, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells('A2:P2');
        worksheet.getCell('A2').value = `Puskesmas: ${puskesmas}`;
        worksheet.getCell('A2').font = { size: 12, bold: true };
        worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
        // Add empty row
        worksheet.addRow([]);
        // Add header rows
        worksheet.addRow([
            'NO',
            'Kode Program/Kegiatan/Sub kegiatan',
            'Uraian Program/Kegiatan/Sub Kegiatan',
            'Sumber Anggaran',
            'Indikator Kinerja Program (Outcome)/Kegiatan (Output)',
            'Satuan',
            'Target',
            '',
            '',
            'Realisasi Capaian',
            '',
            'Tingkat Capaian (%)',
            '',
            '',
            'Permasalahan',
            'Upaya Mengatasi Permasalahan'
        ]);
        worksheet.addRow([
            '',
            '',
            '',
            '',
            '',
            '',
            'Kinerja (K)',
            'Anggaran Kas (Rp)',
            'Pagu Anggaran (Rp)',
            'Kinerja (K)',
            'Anggaran (Rp)',
            'Kinerja (K)',
            'Persentase Terhadap Anggaran Kas (%)',
            'Persentase Terhadap Pagu (%)',
            '',
            ''
        ]);
        worksheet.addRow([
            '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12=10/7*100', '13=11/8*100', '14=11/9*100', '15', '16'
        ]);
        // Merge cells for header
        worksheet.mergeCells('A4:A6');
        worksheet.mergeCells('B4:B6');
        worksheet.mergeCells('C4:C6');
        worksheet.mergeCells('D4:D6');
        worksheet.mergeCells('E4:E6');
        worksheet.mergeCells('F4:F6');
        worksheet.mergeCells('G4:I4'); // Target
        worksheet.mergeCells('J4:K4'); // Realisasi Capaian
        worksheet.mergeCells('L4:N4'); // Tingkat Capaian
        worksheet.mergeCells('O4:O6');
        worksheet.mergeCells('P4:P6');
        // Style headers
        ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'J4', 'L4', 'O4', 'P4'].forEach(cell => {
            worksheet.getCell(cell).font = { bold: true };
            worksheet.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            worksheet.getCell(cell).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' }
            };
        });
        // Style second row headers
        for (let col = 7; col <= 14; col++) {
            const cell = worksheet.getRow(5).getCell(col);
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' }
            };
        }
        // Style third row headers
        for (let col = 1; col <= 16; col++) {
            const cell = worksheet.getRow(6).getCell(col);
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' }
            };
        }
        // Add data rows grouped by kegiatan
        let rowNumber = 1;
        const groupedData = {};
        // Group by kegiatan
        laporanData.forEach((lap) => {
            const kegiatanId = lap.id_kegiatan;
            if (!groupedData[kegiatanId]) {
                groupedData[kegiatanId] = [];
            }
            groupedData[kegiatanId].push(lap);
        });
        // Add rows per kegiatan
        Object.keys(groupedData).forEach((kegiatanId) => {
            const laporan = groupedData[kegiatanId];
            const firstLap = laporan[0];
            const kegiatan = firstLap.subKegiatan?.kegiatanParent;
            if (kegiatan) {
                // Add kegiatan header row
                const kegiatanRow = worksheet.addRow([
                    'I',
                    kegiatan.kode || '',
                    kegiatan.kegiatan || '',
                    '', '', '', '', '', '', '', '', '', '', '', '', ''
                ]);
                kegiatanRow.font = { bold: true };
                kegiatanRow.getCell(1).alignment = { horizontal: 'center' };
            }
            // Add sub kegiatan rows
            laporan.forEach((lap) => {
                const capaianK = lap.target_k === 0 ? 0 : (lap.realisasi_k / lap.target_k) * 100;
                const capaianAngkas = lap.angkas === 0 ? 0 : (lap.realisasi_rp / lap.angkas) * 100;
                const capaianPagu = lap.target_rp === 0 ? 0 : (lap.realisasi_rp / lap.target_rp) * 100;
                worksheet.addRow([
                    rowNumber++,
                    lap.subKegiatan?.kode_sub || '',
                    lap.subKegiatan?.kegiatan || '',
                    lap.sumberAnggaran?.sumber || '',
                    lap.subKegiatan?.indikator_kinerja || '',
                    lap.satuan?.satuannya || '',
                    lap.target_k || 0,
                    lap.angkas || 0,
                    lap.target_rp || 0,
                    lap.realisasi_k || 0,
                    lap.realisasi_rp || 0,
                    capaianK,
                    capaianAngkas,
                    capaianPagu,
                    lap.permasalahan || '',
                    lap.upaya || ''
                ]);
            });
        });
        // Set column widths
        worksheet.columns = [
            { width: 5 }, // NO
            { width: 15 }, // Kode
            { width: 35 }, // Uraian
            { width: 20 }, // Sumber Anggaran
            { width: 40 }, // Indikator Kinerja
            { width: 12 }, // Satuan
            { width: 12 }, // Target K
            { width: 15 }, // Angkas
            { width: 15 }, // Pagu
            { width: 12 }, // Realisasi K
            { width: 15 }, // Realisasi Rp
            { width: 12 }, // Capaian K
            { width: 12 }, // Capaian Angkas
            { width: 12 }, // Capaian Pagu
            { width: 30 }, // Permasalahan
            { width: 30 } // Upaya
        ];
        // Format number columns
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 6) { // Skip header rows
                // Format currency columns
                [7, 8, 9, 10, 11].forEach(col => {
                    const cell = row.getCell(col);
                    if (cell.value && typeof cell.value === 'number') {
                        cell.numFmt = '#,##0';
                    }
                });
                // Format percentage columns
                [12, 13, 14].forEach(col => {
                    const cell = row.getCell(col);
                    if (cell.value && typeof cell.value === 'number') {
                        cell.numFmt = '0.00';
                    }
                });
            }
        });
        // Add borders to all cells with data
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber >= 4) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            }
        });
        // Set response headers
        const filename = `Laporan_${puskesmas}_${bulan || 'All'}_${tahun}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Gagal export laporan', error: error.message });
    }
});
// Export laporan to Excel for admin (all puskesmas or specific)
router.get('/admin/laporan', auth_1.authenticate, async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== 'admin') {
            res.status(403).json({ message: 'Access denied. Admin only.' });
            return;
        }
        const userId = req.query.userId;
        const bulan = req.query.bulan;
        const tahun = req.query.tahun ? parseInt(req.query.tahun) : new Date().getFullYear();
        const status = req.query.status;
        // Build where clause
        const where = {};
        if (userId)
            where.user_id = userId;
        if (bulan)
            where.bulan = bulan;
        if (tahun)
            where.tahun = tahun;
        if (status)
            where.status = status;
        // Fetch laporan data
        const laporanData = await models_1.Laporan.findAll({
            where,
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['id', 'username', 'nama', 'nama_puskesmas', 'kecamatan', 'wilayah']
                },
                {
                    model: models_1.SumberAnggaran,
                    as: 'sumberAnggaran',
                    attributes: ['id_sumber', 'sumber']
                },
                {
                    model: models_1.Satuan,
                    as: 'satuan',
                    attributes: ['id_satuan', 'satuannya']
                },
                {
                    model: models_1.SubKegiatan,
                    as: 'subKegiatan',
                    attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan', 'indikator_kinerja'],
                    include: [{
                            model: models_1.Kegiatan,
                            as: 'kegiatanParent',
                            attributes: ['id_kegiatan', 'kode', 'kegiatan']
                        }]
                }
            ],
            order: [['user_id', 'ASC'], ['id_kegiatan', 'ASC'], ['id_sub_kegiatan', 'ASC']]
        });
        if (laporanData.length === 0) {
            res.status(404).json({ message: 'Tidak ada data laporan untuk di-export' });
            return;
        }
        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Laporan Kinerja');
        // Add title
        worksheet.mergeCells('A1:Q1');
        worksheet.getCell('A1').value = `Laporan Evaluasi Kinerja ${bulan || 'Semua Bulan'} Tahun ${tahun}`;
        worksheet.getCell('A1').font = { size: 14, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells('A2:Q2');
        worksheet.getCell('A2').value = userId ? `Puskesmas: ${laporanData[0].user?.nama_puskesmas}` : 'Semua Puskesmas';
        worksheet.getCell('A2').font = { size: 12, bold: true };
        worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
        // Add empty row
        worksheet.addRow([]);
        // Add header rows
        worksheet.addRow([
            'NO',
            'Puskesmas',
            'Kode Program/Kegiatan/Sub kegiatan',
            'Uraian Program/Kegiatan/Sub Kegiatan',
            'Sumber Anggaran',
            'Indikator Kinerja Program (Outcome)/Kegiatan (Output)',
            'Satuan',
            'Target',
            '',
            '',
            'Realisasi Capaian',
            '',
            'Tingkat Capaian (%)',
            '',
            '',
            'Permasalahan',
            'Upaya Mengatasi Permasalahan'
        ]);
        worksheet.addRow([
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            'Kinerja (K)',
            'Anggaran Kas (Rp)',
            'Pagu Anggaran (Rp)',
            'Kinerja (K)',
            'Anggaran (Rp)',
            'Kinerja (K)',
            'Persentase Terhadap Anggaran Kas (%)',
            'Persentase Terhadap Pagu (%)',
            '',
            ''
        ]);
        worksheet.addRow([
            '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13=11/9*100', '14=12/10*100', '15=12/11*100', '16', '17'
        ]);
        // Merge cells for header
        worksheet.mergeCells('A4:A6');
        worksheet.mergeCells('B4:B6');
        worksheet.mergeCells('C4:C6');
        worksheet.mergeCells('D4:D6');
        worksheet.mergeCells('E4:E6');
        worksheet.mergeCells('F4:F6');
        worksheet.mergeCells('G4:G6');
        worksheet.mergeCells('H4:J4'); // Target
        worksheet.mergeCells('K4:L4'); // Realisasi Capaian
        worksheet.mergeCells('M4:O4'); // Tingkat Capaian
        worksheet.mergeCells('P4:P6');
        worksheet.mergeCells('Q4:Q6');
        // Style headers
        ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'K4', 'M4', 'P4', 'Q4'].forEach(cell => {
            worksheet.getCell(cell).font = { bold: true };
            worksheet.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            worksheet.getCell(cell).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' }
            };
        });
        // Style second row headers
        for (let col = 8; col <= 15; col++) {
            const cell = worksheet.getRow(5).getCell(col);
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' }
            };
        }
        // Style third row headers
        for (let col = 1; col <= 17; col++) {
            const cell = worksheet.getRow(6).getCell(col);
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' }
            };
        }
        // Group data by puskesmas → kegiatan
        let rowNumber = 1;
        const groupedByPuskesmas = {};
        laporanData.forEach((lap) => {
            const puskesmasId = lap.user_id;
            if (!groupedByPuskesmas[puskesmasId]) {
                groupedByPuskesmas[puskesmasId] = {
                    user: lap.user,
                    kegiatan: {}
                };
            }
            const kegiatanId = lap.id_kegiatan;
            if (!groupedByPuskesmas[puskesmasId].kegiatan[kegiatanId]) {
                groupedByPuskesmas[puskesmasId].kegiatan[kegiatanId] = [];
            }
            groupedByPuskesmas[puskesmasId].kegiatan[kegiatanId].push(lap);
        });
        // Add data rows
        Object.keys(groupedByPuskesmas).forEach((puskesmasId) => {
            const puskesmasData = groupedByPuskesmas[puskesmasId];
            const user = puskesmasData.user;
            // Add puskesmas header row
            const puskesmasRow = worksheet.addRow([
                '',
                user?.nama_puskesmas || 'N/A',
                '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
            ]);
            puskesmasRow.font = { bold: true, size: 11 };
            puskesmasRow.getCell(2).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFE0B2' }
            };
            // Add kegiatan rows
            Object.keys(puskesmasData.kegiatan).forEach((kegiatanId) => {
                const laporanList = puskesmasData.kegiatan[kegiatanId];
                const firstLap = laporanList[0];
                const kegiatan = firstLap.subKegiatan?.kegiatanParent;
                if (kegiatan) {
                    // Add kegiatan header row
                    const kegiatanRow = worksheet.addRow([
                        'I',
                        '',
                        kegiatan.kode || '',
                        kegiatan.kegiatan || '',
                        '', '', '', '', '', '', '', '', '', '', '', '', ''
                    ]);
                    kegiatanRow.font = { bold: true };
                    kegiatanRow.getCell(1).alignment = { horizontal: 'center' };
                }
                // Add sub kegiatan rows
                laporanList.forEach((lap) => {
                    const capaianK = lap.target_k === 0 ? 0 : (lap.realisasi_k / lap.target_k) * 100;
                    const capaianAngkas = lap.angkas === 0 ? 0 : (lap.realisasi_rp / lap.angkas) * 100;
                    const capaianPagu = lap.target_rp === 0 ? 0 : (lap.realisasi_rp / lap.target_rp) * 100;
                    worksheet.addRow([
                        rowNumber++,
                        '',
                        lap.subKegiatan?.kode_sub || '',
                        lap.subKegiatan?.kegiatan || '',
                        lap.sumberAnggaran?.sumber || '',
                        lap.subKegiatan?.indikator_kinerja || '',
                        lap.satuan?.satuannya || '',
                        lap.target_k || 0,
                        lap.angkas || 0,
                        lap.target_rp || 0,
                        lap.realisasi_k || 0,
                        lap.realisasi_rp || 0,
                        capaianK,
                        capaianAngkas,
                        capaianPagu,
                        lap.permasalahan || '',
                        lap.upaya || ''
                    ]);
                });
            });
        });
        // Set column widths
        worksheet.columns = [
            { width: 5 }, // NO
            { width: 25 }, // Puskesmas
            { width: 15 }, // Kode
            { width: 35 }, // Uraian
            { width: 20 }, // Sumber Anggaran
            { width: 40 }, // Indikator Kinerja
            { width: 12 }, // Satuan
            { width: 12 }, // Target K
            { width: 15 }, // Angkas
            { width: 15 }, // Pagu
            { width: 12 }, // Realisasi K
            { width: 15 }, // Realisasi Rp
            { width: 12 }, // Capaian K
            { width: 12 }, // Capaian Angkas
            { width: 12 }, // Capaian Pagu
            { width: 30 }, // Permasalahan
            { width: 30 } // Upaya
        ];
        // Format number columns
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 6) {
                // Format currency columns
                [8, 9, 10, 11, 12].forEach(col => {
                    const cell = row.getCell(col);
                    if (cell.value && typeof cell.value === 'number') {
                        cell.numFmt = '#,##0';
                    }
                });
                // Format percentage columns
                [13, 14, 15].forEach(col => {
                    const cell = row.getCell(col);
                    if (cell.value && typeof cell.value === 'number') {
                        cell.numFmt = '0.00';
                    }
                });
            }
        });
        // Add borders
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber >= 4) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            }
        });
        // Add summary sheet
        const summarySheet = workbook.addWorksheet('Ringkasan');
        summarySheet.mergeCells('A1:F1');
        summarySheet.getCell('A1').value = `Ringkasan Laporan Per Puskesmas - ${bulan || 'Semua Bulan'} ${tahun}`;
        summarySheet.getCell('A1').font = { size: 14, bold: true };
        summarySheet.getCell('A1').alignment = { horizontal: 'center' };
        summarySheet.addRow([]);
        summarySheet.addRow(['NO', 'Puskesmas', 'Kecamatan', 'Total Laporan', 'Total Target (Rp)', 'Total Realisasi (Rp)']);
        const headerRow = summarySheet.getRow(3);
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center' };
        headerRow.eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' }
            };
        });
        let summaryNo = 1;
        Object.keys(groupedByPuskesmas).forEach((puskesmasId) => {
            const puskesmasData = groupedByPuskesmas[puskesmasId];
            const user = puskesmasData.user;
            let totalLaporan = 0;
            let totalTarget = 0;
            let totalRealisasi = 0;
            Object.keys(puskesmasData.kegiatan).forEach((kegiatanId) => {
                puskesmasData.kegiatan[kegiatanId].forEach((lap) => {
                    totalLaporan++;
                    totalTarget += lap.target_rp || 0;
                    totalRealisasi += lap.realisasi_rp || 0;
                });
            });
            summarySheet.addRow([
                summaryNo++,
                user?.nama_puskesmas || 'N/A',
                user?.kecamatan || 'N/A',
                totalLaporan,
                totalTarget,
                totalRealisasi
            ]);
        });
        // Format summary sheet
        summarySheet.columns = [
            { width: 5 },
            { width: 30 },
            { width: 20 },
            { width: 15 },
            { width: 20 },
            { width: 20 }
        ];
        summarySheet.eachRow((row, rowNumber) => {
            if (rowNumber > 3) {
                row.getCell(1).alignment = { horizontal: 'center' };
                row.getCell(4).alignment = { horizontal: 'center' };
                [5, 6].forEach(col => {
                    const cell = row.getCell(col);
                    if (cell.value && typeof cell.value === 'number') {
                        cell.numFmt = '#,##0';
                    }
                });
            }
        });
        // Set response headers
        const filename = `Laporan_Admin_${bulan || 'All'}_${tahun}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        console.error('Admin export error:', error);
        res.status(500).json({ message: 'Gagal export laporan', error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=export.routes.js.map