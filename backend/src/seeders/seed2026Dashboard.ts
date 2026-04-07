/**
 * Seed Data untuk Dashboard Testing - 2026 Januari sampai Maret
 * Puskesmas: Leuwiliang, Nanggung, Ciampea
 *
 * Data target anggaran dari: Rekap_Ver3.xlsx (PAGU per sub kegiatan per sumber dana)
 * Data angkas dari: Sistem Informasi Pemerintahan Daerah - Penatausahaan.pdf (alokasi bulanan)
 *
 * Run: cd backend && npx tsx src/seeders/seed2026Dashboard.ts
 * Cleanup: cd backend && npx tsx src/seeders/seed2026Dashboard.ts cleanup
 */

import { sequelize, SubKegiatanTarget, Laporan, User, AnggaranKas } from '../models';
import { v4 as uuidv4 } from 'uuid';

// Constants
const TAHUN = 2026;
const BULAN_LIST = ['Januari', 'Februari', 'Maret'];

// Puskesmas user IDs (dari database)
const PUSKESMAS_USERS = [
  { id: 'bbf904e4-2ab0-4a83-9ac8-461d406c4961', username: 'leuwiliang', nama: 'Leuwiliang' },
  { id: '334b813e-e85b-44d2-811f-da7defcfa0f3', username: 'nanggung', nama: 'Nanggung' },
  { id: '05b88a70-7b42-4115-b2d7-a0cfa5c6ec73', username: 'ciampea', nama: 'Ciampea' },
];

// Sumber Anggaran IDs: 1=BLUD, 2=DAK/BOK, 3=APBD/PAD
// Satuan IDs: 1=Orang, 2=Dokumen, 3=unit kerja, 7=Laporan, 8=Kegiatan

// ======================================================================
// REAL DATA: Target Anggaran dari Rekap_Ver3.xlsx
// Kode sub kegiatan -> id_sub_kegiatan mapping (dari seedReference.ts):
//   1.02.01.2.10.0001 -> 1  (BLUD)
//   1.02.02.2.02.0001 -> 2  (Ibu Hamil)
//   1.02.02.2.02.0005 -> 7  (Usia Pendidikan Dasar)
//   1.02.02.2.02.0010 -> 44 (Gangguan Jiwa Berat)
//   1.02.02.2.02.0011 -> 13 (Terduga Tuberkulosis)
//   1.02.02.2.02.0015 -> 17 (Gizi Masyarakat)
//   1.02.02.2.02.0017 -> 19 (Kesehatan Lingkungan)
//   1.02.02.2.02.0020 -> 22 (Surveilans Kesehatan)
//   1.02.02.2.02.0021 -> 46 (ODMK)
//   1.02.02.2.02.0025 -> 25 (Penyakit Menular & Tidak Menular)
//   1.02.02.2.02.0033 -> 30 (Operasional Pelayanan Puskesmas)
//   1.02.02.2.02.0046 -> 42 (Kesehatan Ibu dan Anak)
//   1.02.02.2.02.0048 -> 49 (Pelayanan Imunisasi)
//   1.02.05.2.03.0001 -> 37 (UKBM)
//
// Kegiatan mapping:
//   id_kegiatan=1 -> 1.02.01.2.10 (BLUD)
//   id_kegiatan=2 -> 1.02.02.2.02 (Layanan Kesehatan UKM/UKP)
//   id_kegiatan=4 -> 1.02.05.2.03 (UKBM)
// ======================================================================

interface TargetEntry {
  id_sub_kegiatan: number;
  id_kegiatan: number;
  id_sumber_anggaran: number; // 1=BLUD, 2=BOK, 3=PAD
  id_satuan: number;
  target_rp: number;       // Pagu dari Excel
  target_k: number;        // Volume target
  kode_rekening: string;   // Kode sub kegiatan
}

interface AngkasEntry {
  kode_rekening: string;
  bulanan: number[];  // 12 bulan (Jan-Dec)
}

// Target anggaran per puskesmas (dari Rekap_Ver3.xlsx)
const REAL_TARGETS: Record<string, TargetEntry[]> = {
  Leuwiliang: [
    { id_sub_kegiatan: 1,  id_kegiatan: 1, id_sumber_anggaran: 1, id_satuan: 7, target_rp: 5_535_820_000, target_k: 12, kode_rekening: '1.02.01.2.10.0001' },
    { id_sub_kegiatan: 2,  id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 167_180_000,   target_k: 240, kode_rekening: '1.02.02.2.02.0001' },
    { id_sub_kegiatan: 7,  id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 15_120_000,    target_k: 120, kode_rekening: '1.02.02.2.02.0005' },
    { id_sub_kegiatan: 44, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 2_895_000,     target_k: 36,  kode_rekening: '1.02.02.2.02.0010' },
    { id_sub_kegiatan: 13, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 5_020_000,     target_k: 60,  kode_rekening: '1.02.02.2.02.0011' },
    { id_sub_kegiatan: 17, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 2, target_rp: 113_430_000,   target_k: 12,  kode_rekening: '1.02.02.2.02.0015' },
    { id_sub_kegiatan: 19, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 8, target_rp: 5_330_000,     target_k: 12,  kode_rekening: '1.02.02.2.02.0017' },
    { id_sub_kegiatan: 22, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 2, target_rp: 14_031_000,    target_k: 12,  kode_rekening: '1.02.02.2.02.0020' },
    { id_sub_kegiatan: 46, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 6_460_000,     target_k: 48,  kode_rekening: '1.02.02.2.02.0021' },
    { id_sub_kegiatan: 25, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 2, target_rp: 41_070_000,    target_k: 12,  kode_rekening: '1.02.02.2.02.0025' },
    { id_sub_kegiatan: 30, id_kegiatan: 2, id_sumber_anggaran: 3, id_satuan: 7, target_rp: 203_581_221,   target_k: 12,  kode_rekening: '1.02.02.2.02.0033' },
    { id_sub_kegiatan: 30, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 7, target_rp: 122_326_000,   target_k: 12,  kode_rekening: '1.02.02.2.02.0033' },
    { id_sub_kegiatan: 42, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 2, target_rp: 3_455_000,     target_k: 12,  kode_rekening: '1.02.02.2.02.0046' },
    { id_sub_kegiatan: 49, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 135_170_000,   target_k: 240, kode_rekening: '1.02.02.2.02.0048' },
    { id_sub_kegiatan: 37, id_kegiatan: 4, id_sumber_anggaran: 2, id_satuan: 8, target_rp: 37_980_000,    target_k: 12,  kode_rekening: '1.02.05.2.03.0001' },
  ],
  Nanggung: [
    { id_sub_kegiatan: 1,  id_kegiatan: 1, id_sumber_anggaran: 1, id_satuan: 7, target_rp: 4_180_893_000, target_k: 12, kode_rekening: '1.02.01.2.10.0001' },
    { id_sub_kegiatan: 2,  id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 105_000_000,   target_k: 180, kode_rekening: '1.02.02.2.02.0001' },
    { id_sub_kegiatan: 7,  id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 10_620_000,    target_k: 100, kode_rekening: '1.02.02.2.02.0005' },
    { id_sub_kegiatan: 44, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 20_250_000,    target_k: 48,  kode_rekening: '1.02.02.2.02.0010' },
    { id_sub_kegiatan: 13, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 8_100_000,     target_k: 60,  kode_rekening: '1.02.02.2.02.0011' },
    { id_sub_kegiatan: 17, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 2, target_rp: 324_180_000,   target_k: 12,  kode_rekening: '1.02.02.2.02.0015' },
    { id_sub_kegiatan: 19, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 8, target_rp: 7_560_000,     target_k: 12,  kode_rekening: '1.02.02.2.02.0017' },
    { id_sub_kegiatan: 22, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 2, target_rp: 21_450_000,    target_k: 12,  kode_rekening: '1.02.02.2.02.0020' },
    { id_sub_kegiatan: 46, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 25_232_000,    target_k: 48,  kode_rekening: '1.02.02.2.02.0021' },
    { id_sub_kegiatan: 25, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 2, target_rp: 58_940_000,    target_k: 12,  kode_rekening: '1.02.02.2.02.0025' },
    { id_sub_kegiatan: 30, id_kegiatan: 2, id_sumber_anggaran: 3, id_satuan: 7, target_rp: 254_904_980,   target_k: 12,  kode_rekening: '1.02.02.2.02.0033' },
    { id_sub_kegiatan: 30, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 7, target_rp: 166_834_000,   target_k: 12,  kode_rekening: '1.02.02.2.02.0033' },
    { id_sub_kegiatan: 42, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 2, target_rp: 888_000,       target_k: 12,  kode_rekening: '1.02.02.2.02.0046' },
    { id_sub_kegiatan: 49, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 103_095_000,   target_k: 180, kode_rekening: '1.02.02.2.02.0048' },
    { id_sub_kegiatan: 37, id_kegiatan: 4, id_sumber_anggaran: 2, id_satuan: 8, target_rp: 35_241_000,    target_k: 12,  kode_rekening: '1.02.05.2.03.0001' },
  ],
  Ciampea: [
    { id_sub_kegiatan: 1,  id_kegiatan: 1, id_sumber_anggaran: 1, id_satuan: 7, target_rp: 7_484_755_000, target_k: 12, kode_rekening: '1.02.01.2.10.0001' },
    { id_sub_kegiatan: 2,  id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 146_900_000,   target_k: 200, kode_rekening: '1.02.02.2.02.0001' },
    { id_sub_kegiatan: 7,  id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 15_200_000,    target_k: 120, kode_rekening: '1.02.02.2.02.0005' },
    { id_sub_kegiatan: 44, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 14_480_000,    target_k: 48,  kode_rekening: '1.02.02.2.02.0010' },
    { id_sub_kegiatan: 13, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 11_100_000,    target_k: 72,  kode_rekening: '1.02.02.2.02.0011' },
    { id_sub_kegiatan: 17, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 2, target_rp: 282_985_000,   target_k: 12,  kode_rekening: '1.02.02.2.02.0015' },
    { id_sub_kegiatan: 19, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 8, target_rp: 16_640_000,    target_k: 12,  kode_rekening: '1.02.02.2.02.0017' },
    { id_sub_kegiatan: 22, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 2, target_rp: 30_417_000,    target_k: 12,  kode_rekening: '1.02.02.2.02.0020' },
    { id_sub_kegiatan: 46, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 25_580_000,    target_k: 48,  kode_rekening: '1.02.02.2.02.0021' },
    { id_sub_kegiatan: 25, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 2, target_rp: 111_990_000,   target_k: 12,  kode_rekening: '1.02.02.2.02.0025' },
    { id_sub_kegiatan: 30, id_kegiatan: 2, id_sumber_anggaran: 3, id_satuan: 7, target_rp: 435_061_886,   target_k: 12,  kode_rekening: '1.02.02.2.02.0033' },
    { id_sub_kegiatan: 30, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 7, target_rp: 208_781_000,   target_k: 12,  kode_rekening: '1.02.02.2.02.0033' },
    { id_sub_kegiatan: 42, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 2, target_rp: 2_325_000,     target_k: 12,  kode_rekening: '1.02.02.2.02.0046' },
    { id_sub_kegiatan: 49, id_kegiatan: 2, id_sumber_anggaran: 2, id_satuan: 1, target_rp: 90_000_000,    target_k: 200, kode_rekening: '1.02.02.2.02.0048' },
    { id_sub_kegiatan: 37, id_kegiatan: 4, id_sumber_anggaran: 2, id_satuan: 8, target_rp: 45_755_000,    target_k: 12,  kode_rekening: '1.02.05.2.03.0001' },
  ],
};

// Angkas bulanan dari PDF (SIPD Penatausahaan) - per sub kegiatan (gabungan semua sumber)
// Nilai adalah alokasi per bulan: [Jan, Feb, Mar, Apr, Mei, Jun, Jul, Agu, Sep, Okt, Nov, Des]
const REAL_ANGKAS: Record<string, AngkasEntry[]> = {
  Leuwiliang: [
    { kode_rekening: '1.02.02.2.02.0001', bulanan: [0, 32_245_000, 8_810_000, 7_270_000, 5_570_000, 5_880_000, 6_515_000, 5_880_000, 5_030_000, 4_760_000, 230_000, 990_000] },
    { kode_rekening: '1.02.02.2.02.0005', bulanan: [0, 1_620_000, 1_620_000, 1_620_000, 1_620_000, 1_395_000, 1_395_000, 1_395_000, 1_395_000, 1_395_000, 900_000, 765_000] },
    { kode_rekening: '1.02.02.2.02.0010', bulanan: [0, 580_000, 270_000, 270_000, 270_000, 425_000, 270_000, 270_000, 270_000, 90_000, 90_000, 90_000] },
    { kode_rekening: '1.02.02.2.02.0011', bulanan: [0, 760_000, 360_000, 1_210_000, 605_000, 515_000, 360_000, 515_000, 515_000, 90_000, 90_000, 0] },
    { kode_rekening: '1.02.02.2.02.0015', bulanan: [0, 0, 42_980_000, 2_800_000, 1_755_000, 575_000, 1_755_000, 1_215_000, 450_000, 450_000, 450_000, 0] },
    { kode_rekening: '1.02.02.2.02.0017', bulanan: [0, 1_210_000, 1_210_000, 450_000, 450_000, 760_000, 535_000, 535_000, 90_000, 90_000, 0, 0] },
    { kode_rekening: '1.02.02.2.02.0020', bulanan: [0, 2_730_000, 900_000, 4_011_000, 2_090_000, 1_520_000, 1_160_000, 450_000, 360_000, 270_000, 315_000, 225_000] },
    { kode_rekening: '1.02.02.2.02.0021', bulanan: [0, 180_000, 180_000, 180_000, 5_470_000, 90_000, 90_000, 90_000, 90_000, 90_000, 0, 0] },
    { kode_rekening: '1.02.02.2.02.0025', bulanan: [0, 6_395_000, 5_840_000, 5_855_000, 6_590_000, 4_595_000, 2_430_000, 2_805_000, 2_650_000, 2_200_000, 1_260_000, 450_000] },
    { kode_rekening: '1.02.02.2.02.0033', bulanan: [30_910_370, 1_098_909, 5_075_610, 7_296_020, 4_349_100, 3_480_720, 3_451_610, 4_934_840, 3_457_610, 7_799_990, 1_403_342, 649_100] },
    { kode_rekening: '1.02.02.2.02.0046', bulanan: [0, 270_000, 270_000, 270_000, 1_205_000, 270_000, 270_000, 270_000, 270_000, 180_000, 90_000, 90_000] },
    { kode_rekening: '1.02.02.2.02.0048', bulanan: [0, 13_680_000, 295_000, 1_485_000, 620_000, 10_655_000, 500_000, 2_500_000, 410_000, 9_225_000, 22_500_000, 300_000] },
    { kode_rekening: '1.02.05.2.03.0001', bulanan: [0, 670_000, 360_000, 490_000, 35_560_000, 80_000, 180_000, 180_000, 180_000, 180_000, 0, 0] },
    { kode_rekening: '1.02.01.2.10.0001', bulanan: [461_318_333, 461_318_333, 461_318_333, 461_318_333, 461_318_333, 461_318_333, 461_318_333, 461_318_333, 461_318_333, 461_318_333, 461_318_337, 0] },
  ],
  Nanggung: [
    { kode_rekening: '1.02.02.2.02.0001', bulanan: [0, 21_420_000, 140_000, 14_280_000, 140_000, 7_140_000, 14_280_000, 140_000, 7_140_000, 14_280_000, 520_000, 2_520_000] },
    { kode_rekening: '1.02.02.2.02.0005', bulanan: [0, 0, 0, 540_000, 0, 0, 10_080_000, 0, 0, 0, 0, 0] },
    { kode_rekening: '1.02.02.2.02.0010', bulanan: [0, 4_500_000, 2_250_000, 2_250_000, 2_250_000, 2_250_000, 2_250_000, 2_250_000, 2_250_000, 0, 0, 0] },
    { kode_rekening: '1.02.02.2.02.0011', bulanan: [0, 1_350_000, 675_000, 675_000, 675_000, 675_000, 675_000, 675_000, 675_000, 675_000, 675_000, 675_000] },
    { kode_rekening: '1.02.02.2.02.0015', bulanan: [0, 7_230_000, 2_520_000, 9_520_000, 20_000, 20_000, 520_000, 2_520_000, 2_520_000, 2_520_000, 2_520_000, 2_520_000] },
    { kode_rekening: '1.02.02.2.02.0017', bulanan: [0, 1_260_000, 630_000, 630_000, 630_000, 630_000, 630_000, 630_000, 630_000, 630_000, 630_000, 630_000] },
    { kode_rekening: '1.02.02.2.02.0020', bulanan: [0, 1_980_000, 990_000, 990_000, 990_000, 990_000, 10_560_000, 90_000, 990_000, 990_000, 990_000, 990_000] },
    { kode_rekening: '1.02.02.2.02.0021', bulanan: [0, 0, 0, 0, 14_352_000, 440_000, 5_440_000, 0, 0, 0, 0, 0] },
    { kode_rekening: '1.02.02.2.02.0025', bulanan: [0, 18_890_000, 7_945_000, 4_545_000, 45_000, 945_000, 945_000, 945_000, 945_000, 945_000, 945_000, 945_000] },
    { kode_rekening: '1.02.02.2.02.0033', bulanan: [570_831, 8_554_831, 3_790_831, 2_090_831, 2_190_831, 3_790_831, 6_190_839, 5_545_831, 4_890_831, 1_640_831, 1_240_831, 1_240_831] },
    { kode_rekening: '1.02.02.2.02.0046', bulanan: [0, 888_000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { kode_rekening: '1.02.02.2.02.0048', bulanan: [0, 14_760_000, 380_000, 7_380_000, 7_380_000, 7_380_000, 7_380_000, 14_535_000, 360_000, 7_380_000, 12_780_000, 380_000] },
    { kode_rekening: '1.02.05.2.03.0001', bulanan: [0, 0, 0, 35_241_000, 0, 0, 0, 0, 0, 0, 0, 0] },
    { kode_rekening: '1.02.01.2.10.0001', bulanan: [348_407_750, 348_407_750, 348_407_750, 348_407_750, 348_407_750, 348_407_750, 348_407_750, 348_407_750, 348_407_750, 348_407_750, 348_407_750, 0] },
  ],
  Ciampea: [
    { kode_rekening: '1.02.02.2.02.0001', bulanan: [612_000, 3_306_000, 3_306_000, 6_612_000, 6_612_000, 6_612_000, 6_612_000, 6_612_000, 6_632_000, 3_968_000, 3_968_000, 3_968_000] },
    { kode_rekening: '1.02.02.2.02.0005', bulanan: [150_000, 150_000, 150_000, 150_000, 150_000, 350_000, 150_000, 2_150_000, 2_150_000, 150_000, 150_000, 350_000] },
    { kode_rekening: '1.02.02.2.02.0010', bulanan: [50_000, 950_000, 950_000, 950_000, 950_000, 1_290_000, 950_000, 950_000, 950_000, 950_000, 950_000, 1_290_000] },
    { kode_rekening: '1.02.02.2.02.0011', bulanan: [500_000, 500_000, 500_000, 500_000, 500_000, 500_000, 500_000, 500_000, 500_000, 500_000, 500_000, 500_000] },
    { kode_rekening: '1.02.02.2.02.0015', bulanan: [0, 550_000, 200_000, 200_000, 200_000, 67_235_000, 4_700_000, 7_050_000, 6_700_000, 0, 200_000, 760_000] },
    { kode_rekening: '1.02.02.2.02.0017', bulanan: [0, 0, 0, 0, 0, 0, 0, 0, 7_020_000, 7_020_000, 0, 0] },
    { kode_rekening: '1.02.02.2.02.0020', bulanan: [0, 1_960_000, 600_000, 600_000, 600_000, 600_000, 600_000, 600_000, 600_000, 600_000, 6_825_000, 6_825_000] },
    { kode_rekening: '1.02.02.2.02.0021', bulanan: [860_000, 1_860_000, 1_860_000, 1_860_000, 1_860_000, 1_860_000, 1_860_000, 1_860_000, 1_860_000, 1_860_000, 0, 0] },
    { kode_rekening: '1.02.02.2.02.0025', bulanan: [940_000, 3_940_000, 3_940_000, 7_640_000, 3_940_000, 3_940_000, 3_940_000, 3_940_000, 3_940_000, 7_640_000, 3_940_000, 3_940_000] },
    { kode_rekening: '1.02.02.2.02.0033', bulanan: [30_070_800, 3_466_175, 4_130_000, 862_840, 7_930_000, 7_930_000, 6_930_000, 6_930_000, 6_102_000, 5_550_000, 2_150_000, 2_097_000] },
    { kode_rekening: '1.02.02.2.02.0046', bulanan: [150_000, 150_000, 150_000, 150_000, 150_000, 150_000, 150_000, 150_000, 150_000, 150_000, 150_000, 75_000] },
    { kode_rekening: '1.02.02.2.02.0048', bulanan: [600_000, 5_600_000, 5_600_000, 5_600_000, 5_600_000, 6_400_000, 5_600_000, 7_250_000, 7_250_000, 5_600_000, 7_050_000, 5_600_000] },
    { kode_rekening: '1.02.05.2.03.0001', bulanan: [637_500, 0, 3_637_500, 0, 3_637_500, 3_637_500, 3_637_500, 0, 3_637_500, 3_637_500, 3_707_500, 0] },
    { kode_rekening: '1.02.01.2.10.0001', bulanan: [623_729_583, 623_729_583, 623_729_583, 623_729_583, 623_729_583, 623_729_583, 623_729_583, 623_729_583, 623_729_583, 623_729_583, 623_729_587, 0] },
  ],
};

// Helper
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getWeightedStatus(bulanIndex: number): string {
  const rand = Math.random();
  if (bulanIndex === 0) {
    if (rand < 0.85) return 'diverifikasi';
    if (rand < 0.95) return 'terkirim';
    return 'menunggu';
  } else if (bulanIndex === 1) {
    if (rand < 0.70) return 'diverifikasi';
    if (rand < 0.85) return 'terkirim';
    if (rand < 0.95) return 'menunggu';
    return 'tersimpan';
  } else {
    if (rand < 0.50) return 'diverifikasi';
    if (rand < 0.70) return 'terkirim';
    if (rand < 0.85) return 'menunggu';
    return 'tersimpan';
  }
}

// Get monthly angkas for a specific target entry
function getMonthlyAngkas(puskesmasNama: string, target: TargetEntry, bulan: number): number {
  const angkasList = REAL_ANGKAS[puskesmasNama];
  if (!angkasList) return Math.round(target.target_rp / 12);

  const angkasEntry = angkasList.find(a => a.kode_rekening === target.kode_rekening);
  if (!angkasEntry) return Math.round(target.target_rp / 12);

  // For sub kegiatan with multiple sumber (like 0033 with PAD + BOK),
  // split angkas proportionally based on pagu
  const allTargetsForKode = REAL_TARGETS[puskesmasNama].filter(
    t => t.kode_rekening === target.kode_rekening
  );
  const totalPagu = allTargetsForKode.reduce((sum, t) => sum + t.target_rp, 0);
  const ratio = totalPagu > 0 ? target.target_rp / totalPagu : 1;

  return Math.round(angkasEntry.bulanan[bulan - 1] * ratio);
}

// Get cumulative angkas up to bulan
function getCumulativeAngkas(puskesmasNama: string, target: TargetEntry, bulan: number): number {
  let cumulative = 0;
  for (let b = 1; b <= bulan; b++) {
    cumulative += getMonthlyAngkas(puskesmasNama, target, b);
  }
  return cumulative;
}

// Generate target data from real Excel data
function generateTargetData(): any[] {
  const targets: any[] = [];

  for (const user of PUSKESMAS_USERS) {
    const entries = REAL_TARGETS[user.nama];
    if (!entries) continue;

    for (const entry of entries) {
      targets.push({
        user_id: user.id,
        id_sub_kegiatan: entry.id_sub_kegiatan,
        id_sumber_anggaran: entry.id_sumber_anggaran,
        id_satuan: entry.id_satuan,
        target_k: entry.target_k,
        target_rp: entry.target_rp,
        tahun: TAHUN,
        bulan: null,
        catatan: `Seed data dashboard 2026 - ${user.nama}`,
        created_by: user.id,
      });
    }
  }

  return targets;
}

// Generate angkas records from real PDF data
function generateAngkasData(): any[] {
  const angkasRecords: any[] = [];

  for (const user of PUSKESMAS_USERS) {
    const entries = REAL_TARGETS[user.nama];
    if (!entries) continue;

    for (const entry of entries) {
      for (let bulan = 1; bulan <= 12; bulan++) {
        const nilai = getMonthlyAngkas(user.nama, entry, bulan);
        if (nilai === 0 && bulan > 3) continue; // Skip zero months after March for efficiency

        angkasRecords.push({
          user_id: user.id,
          id_sub_kegiatan: entry.id_sub_kegiatan,
          id_sumber_anggaran: entry.id_sumber_anggaran,
          kode_rekening: entry.kode_rekening,
          uraian: `${entry.kode_rekening}`,
          tahun: TAHUN,
          bulan: bulan,
          nilai: nilai,
          created_by: user.id,
        });
      }
    }
  }

  return angkasRecords;
}

// Generate laporan data for Jan-Mar using real targets and angkas
function generateLaporanData(targets: any[]): any[] {
  const laporans: any[] = [];

  const permasalahanList = [
    'Keterbatasan anggaran operasional',
    'Cuaca tidak mendukung kegiatan lapangan',
    'Kurangnya partisipasi masyarakat',
    'Keterbatasan SDM',
    'Kendala koordinasi lintas sektor',
  ];
  const upayaList = [
    'Melakukan efisiensi anggaran',
    'Penjadwalan ulang kegiatan',
    'Peningkatan sosialisasi ke masyarakat',
    'Koordinasi dengan BPJS',
    'Pengajuan penambahan tenaga',
  ];

  for (const target of targets) {
    const user = PUSKESMAS_USERS.find(u => u.id === target.user_id);
    if (!user) continue;
    const pkmNama = user.nama;
    const realTarget = REAL_TARGETS[pkmNama]?.find(
      t => t.id_sub_kegiatan === target.id_sub_kegiatan &&
        t.id_sumber_anggaran === target.id_sumber_anggaran
    );
    if (!realTarget) continue;

    let cumulativeRealisasiRp = 0;
    let cumulativeRealisasiK = 0;

    for (let bulanIndex = 0; bulanIndex < BULAN_LIST.length; bulanIndex++) {
      const bulan = BULAN_LIST[bulanIndex];
      const bulanNum = bulanIndex + 1;

      // Cumulative angkas from real PDF data
      const cumulativeAngkas = getCumulativeAngkas(pkmNama, realTarget, bulanNum);

      // Monthly angkas
      const monthlyAngkas = getMonthlyAngkas(pkmNama, realTarget, bulanNum);

      // Performance factor: 70-95% of monthly angkas
      const performanceFactor = randomBetween(70, 95) / 100;
      const monthlyRealisasiRp = Math.floor(monthlyAngkas * performanceFactor);
      cumulativeRealisasiRp += monthlyRealisasiRp;

      // Physical YTD percentage
      const yearlyBudget = target.target_rp;
      const physicalYtdPct = yearlyBudget > 0
        ? Math.min(100, Math.round((cumulativeRealisasiRp / yearlyBudget) * 100 * 100) / 100)
        : 0;

      // K values
      const monthlyTargetK = Math.ceil(target.target_k / 12);
      const prevCumulativeK = cumulativeRealisasiK;
      cumulativeRealisasiK = Math.floor((physicalYtdPct / 100) * target.target_k);
      if (cumulativeRealisasiK < prevCumulativeK) cumulativeRealisasiK = prevCumulativeK;
      const monthlyRealisasiK = cumulativeRealisasiK - prevCumulativeK;

      const status = getWeightedStatus(bulanIndex);

      let permasalahan = '';
      let upaya = '';
      if (performanceFactor < 0.80) {
        permasalahan = randomFrom(permasalahanList);
        upaya = randomFrom(upayaList);
      }

      laporans.push({
        id: uuidv4(),
        user_id: target.user_id,
        id_kegiatan: realTarget.id_kegiatan,
        id_sub_kegiatan: target.id_sub_kegiatan,
        id_sumber_anggaran: target.id_sumber_anggaran,
        id_satuan: target.id_satuan,
        target_k: monthlyTargetK * bulanNum,
        target_rp: target.target_rp,
        angkas: cumulativeAngkas,
        realisasi_k: monthlyRealisasiK,
        realisasi_rp: monthlyRealisasiRp,
        realisasi_fisik: physicalYtdPct,
        permasalahan,
        upaya,
        bulan,
        tahun: TAHUN,
        status,
        catatan: performanceFactor < 0.80 ? 'Perlu perhatian khusus' : null,
        verified_by: status === 'diverifikasi' ? '139fc776-d1a2-4ad9-8ca8-6a20fb8107c8' : null,
        verified_at: status === 'diverifikasi' ? new Date() : null,
      });
    }
  }

  return laporans;
}

async function seed() {
  console.log('Starting seed for 2026 Dashboard data (Januari - Maret)...');
  console.log('Data source: Rekap_Ver3.xlsx (target) + SIPD Penatausahaan PDF (angkas)\n');

  try {
    const targets = generateTargetData();
    const angkasData = generateAngkasData();
    const laporans = generateLaporanData(targets);

    console.log(`Generated ${targets.length} target records`);
    console.log(`Generated ${angkasData.length} angkas records`);
    console.log(`Generated ${laporans.length} laporan records\n`);

    // Check existing
    const userIds = PUSKESMAS_USERS.map(u => u.id);
    const existingTargets = await SubKegiatanTarget.count({
      where: { user_id: userIds, tahun: TAHUN }
    });
    const existingLaporans = await Laporan.count({
      where: { user_id: userIds, tahun: TAHUN }
    });
    const existingAngkas = await AnggaranKas.count({
      where: { user_id: userIds, tahun: TAHUN }
    });

    if (existingTargets > 0 || existingLaporans > 0 || existingAngkas > 0) {
      console.log(`Found existing data (${existingTargets} targets, ${existingAngkas} angkas, ${existingLaporans} laporans). Run cleanup first.\n`);
      return;
    }

    // Insert targets
    console.log('Inserting SubKegiatanTarget records...');
    for (const target of targets) {
      await SubKegiatanTarget.findOrCreate({
        where: {
          user_id: target.user_id,
          id_sub_kegiatan: target.id_sub_kegiatan,
          id_sumber_anggaran: target.id_sumber_anggaran,
          tahun: target.tahun,
          bulan: null,
        },
        defaults: target,
      });
    }
    console.log('Targets inserted');

    // Insert angkas
    console.log('Inserting AnggaranKas records...');
    await AnggaranKas.bulkCreate(angkasData, { ignoreDuplicates: true });
    console.log('Angkas inserted');

    // Insert laporans
    console.log('Inserting Laporan records...');
    for (const laporan of laporans) {
      await Laporan.findOrCreate({
        where: {
          user_id: laporan.user_id,
          id_sub_kegiatan: laporan.id_sub_kegiatan,
          id_sumber_anggaran: laporan.id_sumber_anggaran,
          bulan: laporan.bulan,
          tahun: laporan.tahun,
        },
        defaults: laporan,
      });
    }
    console.log('Laporans inserted\n');

    // Summary
    console.log('SUMMARY:');
    console.log('-------------------------------------------');
    for (const user of PUSKESMAS_USERS) {
      const userTargets = targets.filter(t => t.user_id === user.id);
      const userLaporans = laporans.filter(l => l.user_id === user.id);
      const totalPagu = userTargets.reduce((sum, t) => sum + t.target_rp, 0);
      console.log(`   ${user.nama}: ${userTargets.length} targets (pagu: ${totalPagu.toLocaleString('id-ID')}), ${userLaporans.length} laporans`);
    }
    console.log('-------------------------------------------');
    console.log('\nSeed completed successfully!');

  } catch (error) {
    console.error('Error during seed:', error);
    throw error;
  }
}

async function cleanup() {
  console.log('Starting cleanup of 2026 Dashboard seed data...\n');

  try {
    const userIds = PUSKESMAS_USERS.map(u => u.id);

    console.log('Deleting Laporan records...');
    const deletedLaporans = await Laporan.destroy({
      where: { user_id: userIds, tahun: TAHUN },
    });
    console.log(`   Deleted ${deletedLaporans} laporan records`);

    console.log('Deleting AnggaranKas records...');
    const deletedAngkas = await AnggaranKas.destroy({
      where: { user_id: userIds, tahun: TAHUN },
    });
    console.log(`   Deleted ${deletedAngkas} angkas records`);

    console.log('Deleting SubKegiatanTarget records...');
    const deletedTargets = await SubKegiatanTarget.destroy({
      where: { user_id: userIds, tahun: TAHUN },
    });
    console.log(`   Deleted ${deletedTargets} target records`);

    console.log('\nCleanup completed successfully!');

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isCleanup = args.includes('cleanup');

  try {
    await sequelize.authenticate();
    console.log('Database connected\n');

    if (isCleanup) {
      await cleanup();
    } else {
      await seed();
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
