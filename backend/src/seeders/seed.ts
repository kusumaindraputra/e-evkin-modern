/**
 * E-EVKIN Modern - Database Seeder
 * 
 * This script initializes the database with master data and default users.
 * 
 * ⚠️ WARNING: This will DROP ALL EXISTING TABLES and recreate them!
 * Only run this on a fresh database or if you want to reset all data.
 * 
 * Usage:
 *   npm run seed
 * 
 * What gets seeded:
 * - 20 Satuan (units)
 * - 4 Sumber Anggaran (budget sources)
 * - 3 Kegiatan (activities)
 * - 7 Sub Kegiatan (sub-activities)
 * - 1 Admin user (username: dinkes, password: dinkes123)
 * - 102 Puskesmas users (password: bogorkab for all)
 * - Sample Laporan data for 2025 (Januari-November) with status 'terkirim'
 * 
 * Default credentials:
 * - Admin: dinkes / dinkes123
 * - Puskesmas: cibinong / bogorkab (or any username from the list)
 * 
 * @see DATABASE_SEED.md for complete documentation
 */

import { sequelize } from '../config/database';
import User from '../models/User';
import Laporan from '../models/Laporan';
import Satuan from '../models/Satuan';
import SumberAnggaran from '../models/SumberAnggaran';
import Kegiatan from '../models/Kegiatan';
import SubKegiatan from '../models/SubKegiatan';

async function seed() {
  try {
    await sequelize.sync({ force: true }); // This will drop and recreate tables
    console.log('✅ Database synced');

    // Seed Satuan (Master Data)
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
    
    for (const satuan of satuanData) {
      await Satuan.create(satuan);
    }
    console.log(`✅ ${satuanData.length} Satuan created`);

    // Seed Sumber Anggaran (Master Data)
    const sumberAnggaranData = [
      { sumber: 'BLUD Puskesmas' },
      { sumber: 'DAK Non Fisik' },
      { sumber: 'APBD Kabupaten' },
      { sumber: 'JKN' },
    ];
    
    for (const sumber of sumberAnggaranData) {
      await SumberAnggaran.create(sumber);
    }
    console.log(`✅ ${sumberAnggaranData.length} Sumber Anggaran created`);

    // Seed Kegiatan (Master Data)
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
    
    for (const kegiatan of kegiatanData) {
      await Kegiatan.create(kegiatan);
    }
    console.log(`✅ ${kegiatanData.length} Kegiatan created`);

    // Seed Sub Kegiatan (Master Data)
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
    
    for (const subKegiatan of subKegiatanData) {
      await SubKegiatan.create(subKegiatan);
    }
    console.log(`✅ ${subKegiatanData.length} Sub Kegiatan created`);

    // Seed Admin User (let User model handle bcrypt hashing)
    await User.create({
      username: 'dinkes',
      password: 'dinkes123', // Plain password, will be hashed by User model hook
      nama: 'Administrator Dinkes',
      role: 'admin',
    });
    console.log('✅ Admin user created (username: dinkes, password: dinkes123)');

    // Seed Puskesmas data (102 puskesmas dari Bogor, let User model handle password hashing)
    const puskesmasData = [
      { nama: 'Bojonggede', username: 'bojonggede', kecamatan: 'Bojonggede', wilayah: 'Parung', id_blud: 'BLUD' },
      { nama: 'Bagoang', username: 'bagoang', kecamatan: 'Jasinga', wilayah: 'Jasinga', id_blud: 'JKN' },
      { nama: 'Jasinga', username: 'jasinga', kecamatan: 'Jasinga', wilayah: 'Jasinga', id_blud: 'BLUD' },
      { nama: 'Curug', username: 'curug', kecamatan: 'Jasinga', wilayah: 'Jasinga', id_blud: 'JKN' },
      { nama: 'Cigudeg', username: 'cigudeg', kecamatan: 'Cigudeg', wilayah: 'Jasinga', id_blud: 'BLUD' },
      { nama: 'Lebakwangi', username: 'lebakwangi', kecamatan: 'Cigudeg', wilayah: 'Jasinga', id_blud: 'JKN' },
      { nama: 'Bunar', username: 'bunar', kecamatan: 'Cigudeg', wilayah: 'Jasinga', id_blud: 'JKN' },
      { nama: 'Sukajaya', username: 'sukajaya', kecamatan: 'Sukajaya', wilayah: 'Jasinga', id_blud: 'BLUD' },
      { nama: 'Kiara Pandak', username: 'kiarapandak', kecamatan: 'Sukajaya', wilayah: 'Jasinga', id_blud: 'JKN' },
      { nama: 'Parung Panjang', username: 'parungpanjang', kecamatan: 'Parung Panjang', wilayah: 'Jasinga', id_blud: 'BLUD' },
      { nama: 'Dago', username: 'dago', kecamatan: 'Parung Panjang', wilayah: 'Jasinga', id_blud: 'JKN' },
      { nama: 'Tenjo', username: 'tenjo', kecamatan: 'Tenjo', wilayah: 'Jasinga', id_blud: 'BLUD' },
      { nama: 'Pasar Rebo', username: 'pasarrebo', kecamatan: 'Tenjo', wilayah: 'Jasinga', id_blud: 'JKN' },
      { nama: 'Nanggung', username: 'nanggung', kecamatan: 'Nanggung', wilayah: 'Jasinga', id_blud: 'BLUD' },
      { nama: 'Curug Bitung', username: 'curugbitung', kecamatan: 'Nanggung', wilayah: 'Jasinga', id_blud: 'JKN' },
      { nama: 'Leuwiliang', username: 'leuwiliang', kecamatan: 'Leuwiliang', wilayah: 'Leuwiliang', id_blud: 'BLUD' },
      { nama: 'Puraseda', username: 'puraseda', kecamatan: 'Leuwiliang', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Leuwisadeng', username: 'leuwisadeng', kecamatan: 'Leuwisadeng', wilayah: 'Leuwiliang', id_blud: 'BLUD' },
      { nama: 'Sadeng Pasar', username: 'sadengpasar', kecamatan: 'Leuwisadeng', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Rumpin', username: 'rumpin', kecamatan: 'Rumpin', wilayah: 'Leuwiliang', id_blud: 'BLUD' },
      { nama: 'Gobang', username: 'gobang', kecamatan: 'Rumpin', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Cicangkal', username: 'cicangkal', kecamatan: 'Rumpin', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Cibungbulang', username: 'cibungbulang', kecamatan: 'Cibungbulang', wilayah: 'Leuwiliang', id_blud: 'BLUD' },
      { nama: 'Cijujung', username: 'cijujung', kecamatan: 'Cibungbulang', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Situ Udik', username: 'situudik', kecamatan: 'Cibungbulang', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Pamijahan', username: 'pamijahan', kecamatan: 'Pamijahan', wilayah: 'Leuwiliang', id_blud: 'BLUD' },
      { nama: 'Ciasmara', username: 'ciasmara', kecamatan: 'Pamijahan', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Cibening', username: 'cibening', kecamatan: 'Pamijahan', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Ciampea', username: 'ciampea', kecamatan: 'Ciampea', wilayah: 'Leuwiliang', id_blud: 'BLUD' },
      { nama: 'Ciampea Udik', username: 'ciampeaudik', kecamatan: 'Ciampea', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Pasir', username: 'pasir', kecamatan: 'Ciampea', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Cihideung Udik', username: 'cihideungudik', kecamatan: 'Ciampea', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Tenjolaya', username: 'tenjolaya', kecamatan: 'Tenjolaya', wilayah: 'Leuwiliang', id_blud: 'BLUD' },
      { nama: 'Ciomas', username: 'ciomas', kecamatan: 'Ciomas', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Ciapus', username: 'ciapus', kecamatan: 'Ciomas', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Laladon', username: 'laladon', kecamatan: 'Ciomas', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Kota Batu', username: 'kotabatu', kecamatan: 'Ciomas', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Dramaga', username: 'dramaga', kecamatan: 'Tenjolaya', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Kampung Manggis', username: 'kampungmanggis', kecamatan: 'Tenjolaya', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Purwasari', username: 'purwasari', kecamatan: 'Tenjolaya', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Cangkurawok', username: 'cangkurawok', kecamatan: 'Tenjolaya', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Sirnagalih', username: 'sirnagalih', kecamatan: 'Tamansari', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Tamansari', username: 'tamansari', kecamatan: 'Tamansari', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Sukaresmi', username: 'sukaresmi', kecamatan: 'Tamansari', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Ciawi', username: 'ciawi', kecamatan: 'Ciawi', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Banjarsari', username: 'banjarsari', kecamatan: 'Ciawi', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Citapen', username: 'citapen', kecamatan: 'Ciawi', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Cisarua', username: 'cisarua', kecamatan: 'Cisarua', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Cibulan', username: 'cibulan', kecamatan: 'Cisarua', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Megamendung', username: 'megamendung', kecamatan: 'Megamendung', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Sukamanah', username: 'sukamanah', kecamatan: 'Megamendung', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Caringin', username: 'caringin', kecamatan: 'Caringin', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Ciderum', username: 'ciderum', kecamatan: 'Caringin', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Cinagara', username: 'cinagara', kecamatan: 'Caringin', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Cijeruk', username: 'cijeruk', kecamatan: 'Cijeruk', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Sukaharja', username: 'sukaharja', kecamatan: 'Cijeruk', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Cigombong', username: 'cigombong', kecamatan: 'Cigombong', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Ciburayut', username: 'ciburayut', kecamatan: 'Cigombong', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Parung', username: 'parung', kecamatan: 'Parung', wilayah: 'Parung', id_blud: 'BLUD' },
      { nama: 'Cogreg', username: 'cogreg', kecamatan: 'Parung', wilayah: 'Parung', id_blud: 'JKN' },
      { nama: 'Gunung Sindur', username: 'gunungsindur', kecamatan: 'Gunung Sindur', wilayah: 'Parung', id_blud: 'BLUD' },
      { nama: 'Suliwer', username: 'suliwer', kecamatan: 'Gunung Sindur', wilayah: 'Parung', id_blud: 'JKN' },
      { nama: 'Kemang', username: 'kemang', kecamatan: 'Kemang', wilayah: 'Parung', id_blud: 'BLUD' },
      { nama: 'Jampang', username: 'jampang', kecamatan: 'Kemang', wilayah: 'Parung', id_blud: 'JKN' },
      { nama: 'Tajurhalang', username: 'tajurhalang', kecamatan: 'Tajurhalang', wilayah: 'Parung', id_blud: 'BLUD' },
      { nama: 'Kemuning', username: 'kemuning', kecamatan: 'Bojonggede', wilayah: 'Parung', id_blud: 'JKN' },
      { nama: 'Ragajaya', username: 'ragajaya', kecamatan: 'Bojonggede', wilayah: 'Parung', id_blud: 'JKN' },
      { nama: 'Ciseeng', username: 'ciseeng', kecamatan: 'Ciseeng', wilayah: 'Parung', id_blud: 'BLUD' },
      { nama: 'Cibeuteung Udik', username: 'cibeuteungudik', kecamatan: 'Ciseeng', wilayah: 'Parung', id_blud: 'JKN' },
      { nama: 'Bantarjaya', username: 'bantarjaya', kecamatan: 'Rancabungur', wilayah: 'Parung', id_blud: 'BLUD' },
      { nama: 'Rancabungur', username: 'rancabungur', kecamatan: 'Rancabungur', wilayah: 'Parung', id_blud: 'JKN' },
      { nama: 'Cirimekar', username: 'cirimekar', kecamatan: 'Cibinong', wilayah: 'Cibinong', id_blud: 'BLUD' },
      { nama: 'Cibinong', username: 'cibinong', kecamatan: 'Cibinong', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Karadenan', username: 'karadenan', kecamatan: 'Cibinong', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Pabuaran Indah', username: 'pabuaranindah', kecamatan: 'Cibinong', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Gunung Putri', username: 'gunungputri', kecamatan: 'Gunung Putri', wilayah: 'Cibinong', id_blud: 'BLUD' },
      { nama: 'Ciangsana', username: 'ciangsana', kecamatan: 'Gunung Putri', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Karanggan', username: 'karanggan', kecamatan: 'Gunung Putri', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Bojong Nangka', username: 'bojongnangka', kecamatan: 'Gunung Putri', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Cimandala', username: 'cimandala', kecamatan: 'Sukaraja', wilayah: 'Cibinong', id_blud: 'BLUD' },
      { nama: 'Sukaraja', username: 'sukaraja', kecamatan: 'Sukaraja', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Cilebut', username: 'cilebut', kecamatan: 'Sukaraja', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Babakan Madang', username: 'babakanmadang', kecamatan: 'Babakan Madang', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Sentul', username: 'sentul', kecamatan: 'Babakan Madang', wilayah: 'Cibinong', id_blud: 'BLUD' },
      { nama: 'Cijayanti', username: 'cijayanti', kecamatan: 'Babakan Madang', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Citeureup', username: 'citeureup', kecamatan: 'Citeureup', wilayah: 'Cibinong', id_blud: 'BLUD' },
      { nama: 'Leuwinutug', username: 'leuwinutug', kecamatan: 'Citeureup', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Tajur', username: 'tajur', kecamatan: 'Citeureup', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Jonggol', username: 'jonggol', kecamatan: 'Jonggol', wilayah: 'Jonggol', id_blud: 'BLUD' },
      { nama: 'Sukanegara', username: 'sukanegara', kecamatan: 'Jonggol', wilayah: 'Jonggol', id_blud: 'JKN' },
      { nama: 'Balekambang', username: 'balekambang', kecamatan: 'Jonggol', wilayah: 'Jonggol', id_blud: 'JKN' },
      { nama: 'Cileungsi', username: 'cileungsi', kecamatan: 'Cileungsi', wilayah: 'Jonggol', id_blud: 'BLUD' },
      { nama: 'Pasir Angin', username: 'pasirangin', kecamatan: 'Cileungsi', wilayah: 'Jonggol', id_blud: 'JKN' },
      { nama: 'Gandoang', username: 'gandoang', kecamatan: 'Cileungsi', wilayah: 'Jonggol', id_blud: 'JKN' },
      { nama: 'Sukamakmur', username: 'sukamakmur', kecamatan: 'Sukamakmur', wilayah: 'Jonggol', id_blud: 'BLUD' },
      { nama: 'Sukadamai', username: 'sukadamai', kecamatan: 'Sukamakmur', wilayah: 'Jonggol', id_blud: 'JKN' },
      { nama: 'Klapanunggal', username: 'klapanunggal', kecamatan: 'Klapanunggal', wilayah: 'Jonggol', id_blud: 'BLUD' },
      { nama: 'Bojong', username: 'bojong', kecamatan: 'Klapanunggal', wilayah: 'Jonggol', id_blud: 'JKN' },
      { nama: 'Cariu', username: 'cariu', kecamatan: 'Cariu', wilayah: 'Jonggol', id_blud: 'BLUD' },
      { nama: 'Karyamekar', username: 'karyamekar', kecamatan: 'Cariu', wilayah: 'Jonggol', id_blud: 'JKN' },
      { nama: 'Tanjungsari', username: 'tanjungsari', kecamatan: 'Tanjungsari', wilayah: 'Jonggol', id_blud: 'BLUD' },
      { nama: 'Labkesda', username: 'labkesda', kecamatan: '', wilayah: '', id_blud: '' },
    ];

    for (const puskesmas of puskesmasData) {
      await User.create({
        username: puskesmas.username,
        password: 'bogorkab', // Plain password, will be hashed by User model hook
        nama: puskesmas.nama,
        nama_puskesmas: puskesmas.nama,
        role: 'puskesmas',
        id_blud: puskesmas.id_blud,
        kecamatan: puskesmas.kecamatan,
        wilayah: puskesmas.wilayah,
      });
    }
    console.log(`✅ ${puskesmasData.length} Puskesmas users created`);

    // Seed sample Laporan data untuk 5 puskesmas pertama
    const users = await User.findAll({ 
      where: { role: 'puskesmas' },
      attributes: ['id'], // Only fetch ID to reduce memory
      limit: 5,
      raw: true
    });

    // Pre-fetch sub kegiatan mapping to avoid repeated queries 
    const subKegiatanMap = await SubKegiatan.findAll({
      attributes: ['id_sub_kegiatan', 'id_kegiatan'],
      raw: true
    }).then(data => 
      data.reduce((map: Record<number, number>, item: any) => {
        map[item.id_sub_kegiatan] = item.id_kegiatan;
        return map;
      }, {})
    );

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November'];
    const subKegiatanIds = Object.keys(subKegiatanMap).map(Number);
    
    // Create laporan data in batch
    const laporanBulkData = [];
    
    for (const user of users) {
      for (const month of months) {
        // Create 2-3 laporan per puskesmas per bulan dengan sub kegiatan yang berbeda
        const numReports = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < numReports; i++) {
          const subKegiatanId = subKegiatanIds[Math.floor(Math.random() * subKegiatanIds.length)];
          
          laporanBulkData.push({
            user_id: user.id,
            id_kegiatan: subKegiatanMap[subKegiatanId] || 2,
            id_sub_kegiatan: subKegiatanId,
            id_sumber_anggaran: Math.floor(Math.random() * 4) + 1, // Random 1-4
            id_satuan: Math.floor(Math.random() * 20) + 1, // Random 1-20
            target_k: Math.floor(Math.random() * 50) + 10,
            angkas: Math.floor(Math.random() * 500000000) + 100000000,
            target_rp: Math.floor(Math.random() * 800000000) + 200000000,
            realisasi_k: Math.floor(Math.random() * 40) + 5,
            realisasi_rp: Math.floor(Math.random() * 700000000) + 100000000,
            permasalahan: `Permasalahan sample untuk kegiatan ${subKegiatanId} bulan ${month}`,
            upaya: `Upaya penyelesaian untuk kegiatan ${subKegiatanId} bulan ${month}`,
            bulan: month,
            tahun: 2025,
            status: 'terkirim' as const, // Set status ke terkirim agar muncul di dashboard
          });
        }
      }
    }

    // Insert all laporan in single batch operation
    await Laporan.bulkCreate(laporanBulkData);
    console.log(`✅ Sample laporan data created for ${users.length} puskesmas`);

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n=== Master Data ===');
    console.log(`✅ ${satuanData.length} Satuan`);
    console.log(`✅ ${sumberAnggaranData.length} Sumber Anggaran`);
    console.log(`✅ ${kegiatanData.length} Kegiatan`);
    console.log(`✅ ${subKegiatanData.length} Sub Kegiatan`);
    console.log('\n=== User Credentials ===');
    console.log('Admin - username: dinkes, password: dinkes123');
    console.log('Puskesmas - username: cibinong (or any from list), password: bogorkab');
    console.log(`\n=== Summary ===`);
    console.log(`Total: 1 Admin + ${puskesmasData.length} Puskesmas + Sample Laporan Data`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
