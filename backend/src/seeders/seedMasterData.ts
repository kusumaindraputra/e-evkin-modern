/**
 * E-EVKIN Modern - Reference Data Seeder (No Laporan/Target)
 * 
 * Seeds master data and users only - NO laporan or target data.
 * Use this for fresh deployments where you want to import real data.
 * 
 * Usage:
 *   cd backend && npx tsx src/seeders/seedMasterData.ts
 * 
 * What gets seeded:
 * - 20 Satuan (units of measurement)
 * - 4 Sumber Anggaran (funding sources)
 * - 3 Kegiatan (activities)
 * - 7 Sub Kegiatan (sub-activities)
 * - 7 SubKegiatanSumberAnggaran links (which sub-kegiatan uses which funding)
 * - 1 Admin user (dinkes/dinkes123)
 * - 102 Puskesmas users (password: bogorkab)
 * 
 * NOT seeded:
 * - Laporan (reports)
 * - SubKegiatanTarget (yearly targets)
 * - AnggaranKas (monthly budget)
 */

import { sequelize } from '../config/database';
import User from '../models/User';
import Satuan from '../models/Satuan';
import SumberAnggaran from '../models/SumberAnggaran';
import Kegiatan from '../models/Kegiatan';
import SubKegiatan from '../models/SubKegiatan';
import SubKegiatanSumberAnggaran from '../models/SubKegiatanSumberAnggaran';
// Import all models for table creation
import '../models/index';

async function seedMasterData() {
  try {
    console.log('🚀 Starting Master Data Seed (No Laporan/Target)...\n');
    
    // Sync database - force:true will drop all tables
    await sequelize.sync({ force: true });
    console.log('✅ Database synced (all tables recreated)\n');

    // ============================================
    // 1. SATUAN (Units of Measurement)
    // ============================================
    const satuanData = [
      { satuannya: 'Orang' },
      { satuannya: 'Kegiatan' },
      { satuannya: 'Dokumen' },
      { satuannya: 'Paket' },
      { satuannya: 'Kali' },
      { satuannya: 'Unit' },
      { satuannya: 'Bulan' },
      { satuannya: 'Tahun' },
      { satuannya: 'Hari' },
      { satuannya: 'Jam' },
      { satuannya: 'Lembar' },
      { satuannya: 'Set' },
      { satuannya: 'Kelas' },
      { satuannya: 'Kelompok' },
      { satuannya: 'Desa' },
      { satuannya: 'Posyandu' },
      { satuannya: 'Puskesmas' },
      { satuannya: 'Laporan' },
      { satuannya: 'Kasus' },
      { satuannya: 'Sampel' },
    ];
    
    await Satuan.bulkCreate(satuanData);
    console.log(`✅ ${satuanData.length} Satuan created`);

    // ============================================
    // 2. SUMBER ANGGARAN (Funding Sources)
    // ============================================
    const sumberAnggaranData = [
      { sumber: 'BLUD Puskesmas' },
      { sumber: 'DAK Non Fisik' },
      { sumber: 'APBD Kabupaten' },
      { sumber: 'JKN' },
    ];
    
    await SumberAnggaran.bulkCreate(sumberAnggaranData);
    console.log(`✅ ${sumberAnggaranData.length} Sumber Anggaran created`);

    // ============================================
    // 3. KEGIATAN (Activities)
    // ============================================
    const kegiatanData = [
      {
        id_uraian: 1,
        kode: '1.02.01',
        kegiatan: 'Peningkatan Kapasitas SDM Kesehatan',
      },
      {
        id_uraian: 2,
        kode: '1.02.02',
        kegiatan: 'Penyelenggaraan Pelayanan Kesehatan Masyarakat',
      },
      {
        id_uraian: 3,
        kode: '1.02.03',
        kegiatan: 'Pembinaan dan Pengawasan Upaya Kesehatan',
      },
    ];
    
    await Kegiatan.bulkCreate(kegiatanData);
    console.log(`✅ ${kegiatanData.length} Kegiatan created`);

    // ============================================
    // 4. SUB KEGIATAN (Sub-Activities)
    // ============================================
    const subKegiatanData = [
      {
        id_kegiatan: 1,
        kode_sub: '1.02.01.01',
        kegiatan: 'Pelatihan Tenaga Kesehatan Puskesmas',
        indikator_kinerja: 'Jumlah tenaga kesehatan yang mengikuti pelatihan',
      },
      {
        id_kegiatan: 1,
        kode_sub: '1.02.01.02',
        kegiatan: 'Sosialisasi Program Kesehatan',
        indikator_kinerja: 'Jumlah kegiatan sosialisasi yang dilaksanakan',
      },
      {
        id_kegiatan: 2,
        kode_sub: '1.02.02.01',
        kegiatan: 'Pelayanan Kesehatan Ibu dan Anak',
        indikator_kinerja: 'Jumlah ibu hamil yang mendapat pelayanan ANC',
      },
      {
        id_kegiatan: 2,
        kode_sub: '1.02.02.02',
        kegiatan: 'Pelayanan Imunisasi Dasar',
        indikator_kinerja: 'Cakupan imunisasi dasar lengkap',
      },
      {
        id_kegiatan: 2,
        kode_sub: '1.02.02.03',
        kegiatan: 'Pelayanan Gizi Masyarakat',
        indikator_kinerja: 'Jumlah balita yang mendapat PMT',
      },
      {
        id_kegiatan: 3,
        kode_sub: '1.02.03.01',
        kegiatan: 'Monitoring dan Evaluasi Program Kesehatan',
        indikator_kinerja: 'Jumlah kegiatan monitoring yang dilaksanakan',
      },
      {
        id_kegiatan: 3,
        kode_sub: '1.02.03.02',
        kegiatan: 'Pembinaan Posyandu',
        indikator_kinerja: 'Jumlah posyandu yang dibina',
      },
    ];
    
    await SubKegiatan.bulkCreate(subKegiatanData);
    console.log(`✅ ${subKegiatanData.length} Sub Kegiatan created`);

    // ============================================
    // 5. SUB KEGIATAN - SUMBER ANGGARAN (Links)
    // ============================================
    // Link each sub kegiatan to multiple sumber anggaran
    const subKegiatanSumberAnggaranData = [];
    for (let subKegId = 1; subKegId <= 7; subKegId++) {
      // Each sub kegiatan linked to BLUD (1) and JKN (4)
      subKegiatanSumberAnggaranData.push(
        { id_sub_kegiatan: subKegId, id_sumber_anggaran: 1 }, // BLUD
        { id_sub_kegiatan: subKegId, id_sumber_anggaran: 4 }, // JKN
      );
    }
    
    await SubKegiatanSumberAnggaran.bulkCreate(subKegiatanSumberAnggaranData);
    console.log(`✅ ${subKegiatanSumberAnggaranData.length} SubKegiatan-SumberAnggaran links created`);

    // ============================================
    // 6. ADMIN USER
    // ============================================
    await User.create({
      username: 'dinkes',
      password: 'dinkes123',
      nama: 'Administrator Dinkes',
      role: 'admin',
    });
    console.log('✅ Admin user created (dinkes/dinkes123)');

    // ============================================
    // 7. PUSKESMAS USERS (102 users)
    // ============================================
    const puskesmasData = [
      { nama: 'Bojonggede', username: 'bojonggede', kecamatan: 'Bojonggede', wilayah: 'Parung', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0018' },
      { nama: 'Bagoang', username: 'bagoang', kecamatan: 'Jasinga', wilayah: 'Jasinga', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0052' },
      { nama: 'Jasinga', username: 'jasinga', kecamatan: 'Jasinga', wilayah: 'Jasinga', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0010' },
      { nama: 'Curug', username: 'curug', kecamatan: 'Jasinga', wilayah: 'Jasinga', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0053' },
      { nama: 'Cigudeg', username: 'cigudeg', kecamatan: 'Cigudeg', wilayah: 'Jasinga', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0022' },
      { nama: 'Lebakwangi', username: 'lebakwangi', kecamatan: 'Cigudeg', wilayah: 'Jasinga', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0054' },
      { nama: 'Bunar', username: 'bunar', kecamatan: 'Cigudeg', wilayah: 'Jasinga', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0055' },
      { nama: 'Sukajaya', username: 'sukajaya', kecamatan: 'Sukajaya', wilayah: 'Jasinga', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0031' },
      { nama: 'Kiara Pandak', username: 'kiarapandak', kecamatan: 'Sukajaya', wilayah: 'Jasinga', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0056' },
      { nama: 'Parung Panjang', username: 'parungpanjang', kecamatan: 'Parung Panjang', wilayah: 'Jasinga', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0032' },
      { nama: 'Dago', username: 'dago', kecamatan: 'Parung Panjang', wilayah: 'Jasinga', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0057' },
      { nama: 'Tenjo', username: 'tenjo', kecamatan: 'Tenjo', wilayah: 'Jasinga', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0030' },
      { nama: 'Pasar Rebo', username: 'pasarrebo', kecamatan: 'Tenjo', wilayah: 'Jasinga', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0058' },
      { nama: 'Nanggung', username: 'nanggung', kecamatan: 'Nanggung', wilayah: 'Jasinga', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0013' },
      { nama: 'Curug Bitung', username: 'curugbitung', kecamatan: 'Nanggung', wilayah: 'Jasinga', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0059' },
      { nama: 'Leuwiliang', username: 'leuwiliang', kecamatan: 'Leuwiliang', wilayah: 'Leuwiliang', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0012' },
      { nama: 'Puraseda', username: 'puraseda', kecamatan: 'Leuwiliang', wilayah: 'Leuwiliang', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0060' },
      { nama: 'Leuwisadeng', username: 'leuwisadeng', kecamatan: 'Leuwisadeng', wilayah: 'Leuwiliang', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0036' },
      { nama: 'Sadeng Pasar', username: 'sadengpasar', kecamatan: 'Leuwisadeng', wilayah: 'Leuwiliang', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0061' },
      { nama: 'Rumpin', username: 'rumpin', kecamatan: 'Rumpin', wilayah: 'Leuwiliang', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0034' },
      { nama: 'Gobang', username: 'gobang', kecamatan: 'Rumpin', wilayah: 'Leuwiliang', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0062' },
      { nama: 'Cicangkal', username: 'cicangkal', kecamatan: 'Rumpin', wilayah: 'Leuwiliang', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0063' },
      { nama: 'Cibungbulang', username: 'cibungbulang', kecamatan: 'Cibungbulang', wilayah: 'Leuwiliang', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0011' },
      { nama: 'Cijujung', username: 'cijujung', kecamatan: 'Cibungbulang', wilayah: 'Leuwiliang', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0064' },
      { nama: 'Situ Udik', username: 'situudik', kecamatan: 'Cibungbulang', wilayah: 'Leuwiliang', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0065' },
      { nama: 'Pamijahan', username: 'pamijahan', kecamatan: 'Pamijahan', wilayah: 'Leuwiliang', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0035' },
      { nama: 'Ciasmara', username: 'ciasmara', kecamatan: 'Pamijahan', wilayah: 'Leuwiliang', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0066' },
      { nama: 'Cibening', username: 'cibening', kecamatan: 'Pamijahan', wilayah: 'Leuwiliang', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0067' },
      { nama: 'Ciampea', username: 'ciampea', kecamatan: 'Ciampea', wilayah: 'Leuwiliang', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0014' },
      { nama: 'Ciampea Udik', username: 'ciampeaudik', kecamatan: 'Ciampea', wilayah: 'Leuwiliang', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0068' },
      { nama: 'Pasir', username: 'pasir', kecamatan: 'Ciampea', wilayah: 'Leuwiliang', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0069' },
      { nama: 'Cihideung Udik', username: 'cihideungudik', kecamatan: 'Ciampea', wilayah: 'Leuwiliang', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0070' },
      { nama: 'Tenjolaya', username: 'tenjolaya', kecamatan: 'Tenjolaya', wilayah: 'Leuwiliang', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0033' },
      { nama: 'Ciomas', username: 'ciomas', kecamatan: 'Ciomas', wilayah: 'Ciawi', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0038' },
      { nama: 'Ciapus', username: 'ciapus', kecamatan: 'Ciomas', wilayah: 'Ciawi', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0072' },
      { nama: 'Laladon', username: 'laladon', kecamatan: 'Ciomas', wilayah: 'Ciawi', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0071' },
      { nama: 'Kota Batu', username: 'kotabatu', kecamatan: 'Ciomas', wilayah: 'Ciawi', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0073' },
      { nama: 'Dramaga', username: 'dramaga', kecamatan: 'Tenjolaya', wilayah: 'Ciawi', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0037' },
      { nama: 'Kampung Manggis', username: 'kampungmanggis', kecamatan: 'Tenjolaya', wilayah: 'Ciawi', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0076' },
      { nama: 'Purwasari', username: 'purwasari', kecamatan: 'Tenjolaya', wilayah: 'Ciawi', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0077' },
      { nama: 'Cangkurawok', username: 'cangkurawok', kecamatan: 'Tenjolaya', wilayah: 'Ciawi', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0078' },
      { nama: 'Sirnagalih', username: 'sirnagalih', kecamatan: 'Tamansari', wilayah: 'Ciawi', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0020' },
      { nama: 'Tamansari', username: 'tamansari', kecamatan: 'Tamansari', wilayah: 'Ciawi', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0074' },
      { nama: 'Sukaresmi', username: 'sukaresmi', kecamatan: 'Tamansari', wilayah: 'Ciawi', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0075' },
      { nama: 'Ciawi', username: 'ciawi', kecamatan: 'Ciawi', wilayah: 'Ciawi', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0015' },
      { nama: 'Banjarsari', username: 'banjarsari', kecamatan: 'Ciawi', wilayah: 'Ciawi', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0081' },
      { nama: 'Citapen', username: 'citapen', kecamatan: 'Ciawi', wilayah: 'Ciawi', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0082' },
      { nama: 'Cisarua', username: 'cisarua', kecamatan: 'Cisarua', wilayah: 'Ciawi', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0040' },
      { nama: 'Cibulan', username: 'cibulan', kecamatan: 'Cisarua', wilayah: 'Ciawi', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0079' },
      { nama: 'Megamendung', username: 'megamendung', kecamatan: 'Megamendung', wilayah: 'Ciawi', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0041' },
      { nama: 'Sukamanah', username: 'sukamanah', kecamatan: 'Megamendung', wilayah: 'Ciawi', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0080' },
      { nama: 'Caringin', username: 'caringin', kecamatan: 'Caringin', wilayah: 'Ciawi', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0039' },
      { nama: 'Ciderum', username: 'ciderum', kecamatan: 'Caringin', wilayah: 'Ciawi', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0083' },
      { nama: 'Cinagara', username: 'cinagara', kecamatan: 'Caringin', wilayah: 'Ciawi', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0084' },
      { nama: 'Cijeruk', username: 'cijeruk', kecamatan: 'Cijeruk', wilayah: 'Ciawi', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0017' },
      { nama: 'Sukaharja', username: 'sukaharja', kecamatan: 'Cijeruk', wilayah: 'Ciawi', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0086' },
      { nama: 'Cigombong', username: 'cigombong', kecamatan: 'Cigombong', wilayah: 'Ciawi', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0016' },
      { nama: 'Ciburayut', username: 'ciburayut', kecamatan: 'Cigombong', wilayah: 'Ciawi', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0085' },
      { nama: 'Parung', username: 'parung', kecamatan: 'Parung', wilayah: 'Parung', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0019' },
      { nama: 'Cogreg', username: 'cogreg', kecamatan: 'Parung', wilayah: 'Parung', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0089' },
      { nama: 'Gunung Sindur', username: 'gunungsindur', kecamatan: 'Gunung Sindur', wilayah: 'Parung', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0042' },
      { nama: 'Suliwer', username: 'suliwer', kecamatan: 'Gunung Sindur', wilayah: 'Parung', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0091' },
      { nama: 'Kemang', username: 'kemang', kecamatan: 'Kemang', wilayah: 'Parung', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0044' },
      { nama: 'Jampang', username: 'jampang', kecamatan: 'Kemang', wilayah: 'Parung', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0087' },
      { nama: 'Tajurhalang', username: 'tajurhalang', kecamatan: 'Tajurhalang', wilayah: 'Parung', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0021' },
      { nama: 'Kemuning', username: 'kemuning', kecamatan: 'Bojonggede', wilayah: 'Parung', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0092' },
      { nama: 'Ragajaya', username: 'ragajaya', kecamatan: 'Bojonggede', wilayah: 'Parung', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0093' },
      { nama: 'Ciseeng', username: 'ciseeng', kecamatan: 'Ciseeng', wilayah: 'Parung', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0043' },
      { nama: 'Cibeuteung Udik', username: 'cibeuteungudik', kecamatan: 'Ciseeng', wilayah: 'Parung', id_blud: 'JKN', kode_sub_unit: null },
      { nama: 'Bantarjaya', username: 'bantarjaya', kecamatan: 'Rancabungur', wilayah: 'Parung', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0029' },
      { nama: 'Rancabungur', username: 'rancabungur', kecamatan: 'Rancabungur', wilayah: 'Parung', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0088' },
      { nama: 'Cirimekar', username: 'cirimekar', kecamatan: 'Cibinong', wilayah: 'Cibinong', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0024' },
      { nama: 'Cibinong', username: 'cibinong', kecamatan: 'Cibinong', wilayah: 'Cibinong', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0094' },
      { nama: 'Karadenan', username: 'karadenan', kecamatan: 'Cibinong', wilayah: 'Cibinong', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0096' },
      { nama: 'Pabuaran Indah', username: 'pabuaranindah', kecamatan: 'Cibinong', wilayah: 'Cibinong', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0095' },
      { nama: 'Gunung Putri', username: 'gunungputri', kecamatan: 'Gunung Putri', wilayah: 'Cibinong', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0045' },
      { nama: 'Ciangsana', username: 'ciangsana', kecamatan: 'Gunung Putri', wilayah: 'Cibinong', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0104' },
      { nama: 'Karanggan', username: 'karanggan', kecamatan: 'Gunung Putri', wilayah: 'Cibinong', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0105' },
      { nama: 'Bojong Nangka', username: 'bojongnangka', kecamatan: 'Gunung Putri', wilayah: 'Cibinong', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0103' },
      { nama: 'Cimandala', username: 'cimandala', kecamatan: 'Sukaraja', wilayah: 'Cibinong', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0023' },
      { nama: 'Sukaraja', username: 'sukaraja', kecamatan: 'Sukaraja', wilayah: 'Cibinong', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0097' },
      { nama: 'Cilebut', username: 'cilebut', kecamatan: 'Sukaraja', wilayah: 'Cibinong', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0098' },
      { nama: 'Babakan Madang', username: 'babakanmadang', kecamatan: 'Babakan Madang', wilayah: 'Cibinong', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0101' },
      { nama: 'Sentul', username: 'sentul', kecamatan: 'Babakan Madang', wilayah: 'Cibinong', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0027' },
      { nama: 'Cijayanti', username: 'cijayanti', kecamatan: 'Babakan Madang', wilayah: 'Cibinong', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0102' },
      { nama: 'Citeureup', username: 'citeureup', kecamatan: 'Citeureup', wilayah: 'Cibinong', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0025' },
      { nama: 'Leuwinutug', username: 'leuwinutug', kecamatan: 'Citeureup', wilayah: 'Cibinong', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0099' },
      { nama: 'Tajur', username: 'tajur', kecamatan: 'Citeureup', wilayah: 'Cibinong', id_blud: 'JKN', kode_sub_unit: null },
      { nama: 'Jonggol', username: 'jonggol', kecamatan: 'Jonggol', wilayah: 'Jonggol', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0026' },
      { nama: 'Sukanegara', username: 'sukanegara', kecamatan: 'Jonggol', wilayah: 'Jonggol', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0109' },
      { nama: 'Balekambang', username: 'balekambang', kecamatan: 'Jonggol', wilayah: 'Jonggol', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0110' },
      { nama: 'Cileungsi', username: 'cileungsi', kecamatan: 'Cileungsi', wilayah: 'Jonggol', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0046' },
      { nama: 'Pasir Angin', username: 'pasirangin', kecamatan: 'Cileungsi', wilayah: 'Jonggol', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0106' },
      { nama: 'Gandoang', username: 'gandoang', kecamatan: 'Cileungsi', wilayah: 'Jonggol', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0107' },
      { nama: 'Sukamakmur', username: 'sukamakmur', kecamatan: 'Sukamakmur', wilayah: 'Jonggol', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0047' },
      { nama: 'Sukadamai', username: 'sukadamai', kecamatan: 'Sukamakmur', wilayah: 'Jonggol', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0111' },
      { nama: 'Klapanunggal', username: 'klapanunggal', kecamatan: 'Klapanunggal', wilayah: 'Jonggol', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0049' },
      { nama: 'Bojong', username: 'bojong', kecamatan: 'Klapanunggal', wilayah: 'Jonggol', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0108' },
      { nama: 'Cariu', username: 'cariu', kecamatan: 'Cariu', wilayah: 'Jonggol', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0048' },
      { nama: 'Karyamekar', username: 'karyamekar', kecamatan: 'Cariu', wilayah: 'Jonggol', id_blud: 'JKN', kode_sub_unit: '1.02.0.00.0.00.01.0112' },
      { nama: 'Tanjungsari', username: 'tanjungsari', kecamatan: 'Tanjungsari', wilayah: 'Jonggol', id_blud: 'BLUD', kode_sub_unit: '1.02.0.00.0.00.01.0028' },
      { nama: 'Labkesda', username: 'labkesda', kecamatan: '', wilayah: '', id_blud: '', kode_sub_unit: null },
    ];

    // Bulk create puskesmas users
    const puskesmasUsers = puskesmasData.map(p => ({
      username: p.username,
      password: 'bogorkab',
      nama: p.nama,
      nama_puskesmas: p.nama,
      role: 'puskesmas' as const,
      id_blud: p.id_blud,
      kecamatan: p.kecamatan,
      wilayah: p.wilayah,
      kode_sub_unit: p.kode_sub_unit || undefined,
    }));

    // Create users one by one (bcrypt hook needs individual creates)
    for (const userData of puskesmasUsers) {
      await User.create(userData);
    }
    console.log(`✅ ${puskesmasData.length} Puskesmas users created`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('🎉 MASTER DATA SEED COMPLETED!');
    console.log('='.repeat(50));
    console.log('\n📊 Data Created:');
    console.log(`   • ${satuanData.length} Satuan`);
    console.log(`   • ${sumberAnggaranData.length} Sumber Anggaran`);
    console.log(`   • ${kegiatanData.length} Kegiatan`);
    console.log(`   • ${subKegiatanData.length} Sub Kegiatan`);
    console.log(`   • ${subKegiatanSumberAnggaranData.length} SubKegiatan-SumberAnggaran links`);
    console.log(`   • 1 Admin user`);
    console.log(`   • ${puskesmasData.length} Puskesmas users`);
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin:     dinkes / dinkes123');
    console.log('   Puskesmas: cibinong / bogorkab (or any username)');
    console.log('\n⚠️  NOT seeded: Laporan, SubKegiatanTarget, AnggaranKas');
    console.log('   Import these via Excel/PDF uploads in the app.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedMasterData();
