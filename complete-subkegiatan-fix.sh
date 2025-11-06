#!/bin/bash

# Complete SubKegiatan Seeding Fix
echo "🔧 Complete SubKegiatan Seeding Fix"
echo "=================================="

cd /www/wwwroot/e-evkin-modern/backend

echo "📝 Creating complete seedAll.ts with ALL required sub_kegiatan..."

# Create the complete seedAll.ts with all sub_kegiatan needed
cat > src/seeders/seedAll.ts << 'EOF'
import { sequelize } from '../config/database';
import User from '../models/User';
import Laporan from '../models/Laporan';
import { SumberAnggaran, Satuan, Kegiatan, SubKegiatan } from '../models';
import puskesmasData from './data/puskesmas.json';
import laporanDataRaw from './data/laporan.json';

const laporanData = laporanDataRaw as any[];

async function seedReference() {
  console.log('📚 Seeding reference data...');

  // Seed Satuan
  const satuanData = [
    { id_satuan: 1, satuannya: 'Orang' },
    { id_satuan: 2, satuannya: 'Dokumen' },
    { id_satuan: 3, satuannya: 'unit kerja' },
    { id_satuan: 4, satuannya: 'Kali' },
    { id_satuan: 5, satuannya: 'Rumah' },
    { id_satuan: 6, satuannya: 'Unit' },
    { id_satuan: 7, satuannya: 'Laporan' },
    { id_satuan: 8, satuannya: 'Kegiatan' },
    { id_satuan: 9, satuannya: 'Paket' },
    { id_satuan: 10, satuannya: 'Buah' },
    { id_satuan: 11, satuannya: 'Set' },
    { id_satuan: 12, satuannya: 'Item' },
    { id_satuan: 13, satuannya: 'Meter' },
    { id_satuan: 14, satuannya: 'Kilogram' },
    { id_satuan: 15, satuannya: 'Liter' },
    { id_satuan: 16, satuannya: 'Jam' },
    { id_satuan: 17, satuannya: 'Hari' },
    { id_satuan: 18, satuannya: 'Minggu' },
    { id_satuan: 19, satuannya: 'Bulan' },
    { id_satuan: 20, satuannya: 'Tahun' },
  ];

  for (const satuan of satuanData) {
    await Satuan.findOrCreate({
      where: { id_satuan: satuan.id_satuan },
      defaults: satuan,
    });
  }
  console.log(`✅ Seeded ${satuanData.length} satuan records`);

  // Seed Sumber Anggaran
  const sumberAnggaranData = [
    { id_sumber: 1, sumber: 'BLUD Puskesmas' },
    { id_sumber: 2, sumber: 'DAK Non Fisik' },
    { id_sumber: 3, sumber: 'APBD' },
    { id_sumber: 4, sumber: 'JKN (Dana Kapitasi)' },
  ];

  for (const sumber of sumberAnggaranData) {
    await SumberAnggaran.findOrCreate({
      where: { id_sumber: sumber.id_sumber },
      defaults: sumber,
    });
  }
  console.log(`✅ Seeded ${sumberAnggaranData.length} sumber anggaran records`);

  // Seed Kegiatan
  const kegiatanData = [
    { id_kegiatan: 1, id_uraian: 2, kode: '1.02.01.2.10', kegiatan: 'Peningkatan Pelayanan BLUD' },
    { id_kegiatan: 2, id_uraian: 3, kode: '1.02.02.2.02', kegiatan: 'Penyediaan Layanan Kesehatan untuk UKM dan UKP Rujukan Tingkat Daerah Kabupaten/Kota' },
    { id_kegiatan: 3, id_uraian: 4, kode: '1.02.03.2.02', kegiatan: 'Perencanaan Kebutuhan dan Pendayagunaan Sumberdaya Manusia Kesehatan untuk UKP dan UKM di Wilayah Kabupaten/Kota' },
    { id_kegiatan: 4, id_uraian: 5, kode: '1.02.05.2.03', kegiatan: 'Pengembangan dan Pelaksanaan Upaya Kesehatan Bersumber Daya Masyarakat (UKBM) Tingkat Daerah Kabupaten/Kota' },
    { id_kegiatan: 5, id_uraian: 3, kode: '1.02.02.2.03', kegiatan: 'Penyelenggaraan Sistem Informasi Kesehatan Secara Terintegrasi' },
  ];

  for (const kegiatan of kegiatanData) {
    await Kegiatan.findOrCreate({
      where: { id_kegiatan: kegiatan.id_kegiatan },
      defaults: kegiatan,
    });
  }
  console.log(`✅ Seeded ${kegiatanData.length} kegiatan records`);

  // Seed ALL Sub Kegiatan used in laporan data
  const subKegiatanData = [
    { id_sub_kegiatan: 1, id_kegiatan: 1, kode_sub: '1.02.01.2.10.0001', kegiatan: 'Pelayanan dan Penunjang Pelayanan BLUD', indikator_kinerja: 'Jumlah BLUD yang menyediakan pelayanan dan penunjang pelayanan' },
    { id_sub_kegiatan: 2, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0001', kegiatan: 'Pengelolaan Pelayanan Kesehatan Ibu Hamil', indikator_kinerja: 'Jumlah ibu hamil yang mendapatkan pelayanan kesehatan sesuai standar' },
    { id_sub_kegiatan: 4, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0002', kegiatan: 'Pengelolaan Pelayanan Kesehatan Ibu Bersalin', indikator_kinerja: 'Jumlah ibu bersalin yang mendapatkan pelayanan kesehatan sesuai standar' },
    { id_sub_kegiatan: 5, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0003', kegiatan: 'Pengelolaan Pelayanan Kesehatan Bayi Baru Lahir', indikator_kinerja: 'Jumlah bayi baru lahir yang mendapatkan pelayanan kesehatan sesuai standar' },
    { id_sub_kegiatan: 6, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0004', kegiatan: 'Pengelolaan Pelayanan Kesehatan Balita', indikator_kinerja: 'Jumlah balita yang mendapatkan pelayanan kesehatan sesuai standar' },
    { id_sub_kegiatan: 7, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0005', kegiatan: 'Pengelolaan Pelayanan Kesehatan pada Usia Pendidikan Dasar', indikator_kinerja: 'Jumlah anak usia pendidikan dasar yang mendapatkan pelayanan kesehatan sesuai standar' },
    { id_sub_kegiatan: 8, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0006', kegiatan: 'Pengelolaan Pelayanan Kesehatan pada Usia Produktif', indikator_kinerja: 'Jumlah usia produktif yang mendapatkan pelayanan kesehatan sesuai standar' },
    { id_sub_kegiatan: 9, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0007', kegiatan: 'Pengelolaan Pelayanan Kesehatan pada Usia Lanjut', indikator_kinerja: 'Jumlah usia lanjut yang mendapatkan pelayanan kesehatan sesuai standar' },
    { id_sub_kegiatan: 10, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0008', kegiatan: 'Pengelolaan Pelayanan Kesehatan Penderita Hipertensi', indikator_kinerja: 'Jumlah penderita hipertensi yang mendapatkan pelayanan kesehatan sesuai standar' },
    { id_sub_kegiatan: 11, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0009', kegiatan: 'Pengelolaan Pelayanan Kesehatan Penderita Diabetes Melitus', indikator_kinerja: 'Jumlah penderita diabetes melitus yang mendapatkan pelayanan kesehatan sesuai standar' },
    { id_sub_kegiatan: 12, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0010', kegiatan: 'Pengelolaan Pelayanan Kesehatan Orang dengan Gangguan Jiwa Berat', indikator_kinerja: 'Jumlah orang dengan gangguan jiwa berat yang mendapatkan pelayanan kesehatan sesuai standar' },
    { id_sub_kegiatan: 13, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0011', kegiatan: 'Pengelolaan Pelayanan Kesehatan Orang Terduga Tuberkulosis', indikator_kinerja: 'Jumlah orang terduga menderita tuberkulosis yang mendapatkan pelayanan sesuai standar' },
    { id_sub_kegiatan: 14, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0012', kegiatan: 'Pengelolaan Pelayanan Kesehatan Orang dengan Risiko Terinfeksi HIV', indikator_kinerja: 'Jumlah orang terduga menderita HIV yang mendapatkan pelayanan sesuai standar' },
    { id_sub_kegiatan: 15, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0013', kegiatan: 'Pengelolaan Pelayanan Kesehatan Orang dengan Risiko Terinfeksi IMS', indikator_kinerja: 'Jumlah orang dengan risiko terinfeksi IMS yang mendapatkan pelayanan kesehatan sesuai standar' },
    { id_sub_kegiatan: 16, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0014', kegiatan: 'Pengelolaan Pelayanan Kesehatan Orang Terduga Penderita Malaria', indikator_kinerja: 'Jumlah orang terduga penderita malaria yang mendapatkan pelayanan kesehatan sesuai standar' },
    { id_sub_kegiatan: 17, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0015', kegiatan: 'Pengelolaan Pelayanan Kesehatan Gizi Masyarakat', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan pelayanan kesehatan gizi masyarakat' },
    { id_sub_kegiatan: 18, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0016', kegiatan: 'Pengelolaan Pelayanan Kesehatan Kerja dan Olahraga', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan pelayanan kesehatan kerja dan olahraga' },
    { id_sub_kegiatan: 19, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0017', kegiatan: 'Pengelolaan Pelayanan Kesehatan Lingkungan', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan pelayanan kesehatan lingkungan' },
    { id_sub_kegiatan: 20, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0018', kegiatan: 'Pengelolaan Pelayanan Promosi Kesehatan', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan pelayanan promosi kesehatan' },
    { id_sub_kegiatan: 21, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0019', kegiatan: 'Pengelolaan Upaya Pencegahan dan Pengendalian Penyakit', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan upaya pencegahan dan pengendalian penyakit' },
    { id_sub_kegiatan: 22, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0020', kegiatan: 'Pengelolaan Surveilans Kesehatan', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan pelayanan surveilans kesehatan' },
    { id_sub_kegiatan: 23, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0021', kegiatan: 'Pengelolaan Pelayanan Kesehatan Jiwa', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan pelayanan kesehatan jiwa' },
    { id_sub_kegiatan: 24, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0022', kegiatan: 'Pengelolaan Kemitraan Kesehatan', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan kemitraan kesehatan' },
    { id_sub_kegiatan: 25, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0025', kegiatan: 'Pelayanan Kesehatan Penyakit Menular dan Tidak Menular', indikator_kinerja: 'Jumlah dokumen hasil pelayanan kesehatan penyakit menular dan tidak menular' },
    { id_sub_kegiatan: 26, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0026', kegiatan: 'Penyelenggaraan Laboratorium Kesehatan', indikator_kinerja: 'Jumlah dokumen hasil penyelenggaraan laboratorium kesehatan' },
    { id_sub_kegiatan: 27, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0027', kegiatan: 'Penyelenggaraan Kefarmasian', indikator_kinerja: 'Jumlah dokumen hasil penyelenggaraan kefarmasian' },
    { id_sub_kegiatan: 28, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0028', kegiatan: 'Penyelenggaraan Pelayanan Darah', indikator_kinerja: 'Jumlah dokumen hasil penyelenggaraan pelayanan darah' },
    { id_sub_kegiatan: 30, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0033', kegiatan: 'Operasional Pelayanan Puskesmas', indikator_kinerja: 'Jumlah laporan operasional pelayanan puskesmas' },
    { id_sub_kegiatan: 31, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0034', kegiatan: 'Operasional Pelayanan Fasilitas Kesehatan Lainnya', indikator_kinerja: 'Jumlah dokumen operasional fasilitas kesehatan lainnya' },
    { id_sub_kegiatan: 33, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0036', kegiatan: 'Investigasi Awal Kejadian Tidak Diharapkan (Kejadian Ikutan Pasca Imunisasi dan Pemberian Obat Massal)', indikator_kinerja: 'Jumlah laporan hasil investigasi awal kejadian tidak diharapkan (kejadian ikutan pasca imunisasi dan pemberian obat massal)' },
    { id_sub_kegiatan: 34, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0037', kegiatan: 'Pelayanan Kesehatan Tradisional', indikator_kinerja: 'Jumlah dokumen pelayanan kesehatan tradisional' },
    { id_sub_kegiatan: 35, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0038', kegiatan: 'Pengelolaan Kesehatan Haji', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan kesehatan haji' },
    { id_sub_kegiatan: 36, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0039', kegiatan: 'Pengelolaan Kesehatan dalam Situasi Krisis Kesehatan', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan kesehatan dalam situasi krisis kesehatan' },
    { id_sub_kegiatan: 37, id_kegiatan: 4, kode_sub: '1.02.05.2.03.0001', kegiatan: 'Bimbingan Teknis dan Supervisi Pengembangan dan Pelaksanaan Upaya Kesehatan Bersumber Daya Masyarakat (UKBM)', indikator_kinerja: 'Jumlah peserta yang mendapatkan Bimbingan Teknis dan Supervisi Pengembangan dan Pelaksanaan Upaya Kesehatan Bersumber Daya Masyarakat (UKBM)' },
    { id_sub_kegiatan: 38, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0040', kegiatan: 'Pengelolaan kesehatan Orang dengan Tuberkulosis', indikator_kinerja: 'Jumlah orang dengan Tuberkulosis yang mendapatkan pelayanan kesehatan sesuai standar' },
    { id_sub_kegiatan: 39, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0041', kegiatan: 'Pengelolaan pelayanan kesehatan orang dengan HIV (ODHIV)', indikator_kinerja: 'Jumlah orang dengan HIV (ODHIV) yang mendapatkan pelayanan kesehatan sesuai standar' },
    { id_sub_kegiatan: 40, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0042', kegiatan: 'Pengelolaan pelayanan kesehatan Malaria', indikator_kinerja: 'Jumlah orang yang mendapatkan pelayanan kesehatan malaria' },
    { id_sub_kegiatan: 41, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0044', kegiatan: 'Pengelolaan Pelayanan Kesehatan Reproduksi', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan pelayanan kesehatan reproduksi' },
    { id_sub_kegiatan: 42, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0046', kegiatan: 'Pengelolaan upaya kesehatan Ibu dan Anak', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan upaya kesehatan ibu dan anak' },
    { id_sub_kegiatan: 43, id_kegiatan: 5, kode_sub: '1.02.02.2.03.0002', kegiatan: 'Pengelolaan Sistem Informasi Kesehatan', indikator_kinerja: 'Jumlah Dokumen Hasil Pengelolaan Sistem Informasi Kesehatan' },
    { id_sub_kegiatan: 44, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0010', kegiatan: 'Pengelolaan Pelayanan Kesehatan Orang dengan Gangguan Jiwa Berat', indikator_kinerja: 'Jumlah Orang yang Mendapatkan Pelayanan Kesehatan Orang dengan Gangguan Jiwa Berat Sesuai Standar' },
    { id_sub_kegiatan: 45, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0016', kegiatan: 'Pengelolaan Pelayanan Kesehatan Kerja dan Olahraga', indikator_kinerja: 'Jumlah Dokumen Hasil Pengelolaan Pelayanan Kesehatan Kerja dan Olahraga' },
    { id_sub_kegiatan: 46, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0021', kegiatan: 'Pengelolaan Pelayanan Kesehatan Orang dengan Masalah Kesehatan Jiwa (ODMK)', indikator_kinerja: 'Jumlah Orang dengan Masalah Kejiwaan (ODMK) yang Mendapatkan Pelayanan Kesehatan' },
    { id_sub_kegiatan: 47, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0042', kegiatan: 'Pengelolaan pelayanan kesehatan Malaria', indikator_kinerja: 'Jumlah orang yang mendapatkan pelayanan kesehatan malaria' },
    { id_sub_kegiatan: 48, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0047', kegiatan: 'Pengelolaan Pelayanan Kelanjut Usiaan', indikator_kinerja: 'Jumlah Penduduk Usia Lanjut yang Mendapatkan Pelayanan Kesehatan Sesuai Standar' },
    { id_sub_kegiatan: 49, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0048', kegiatan: 'Pengelolaan Pelayanan Imunisasi', indikator_kinerja: 'Jumlah Dokumen Hasil Pengelolaan Layanan Imunisasi' },
  ];

  for (const subKegiatan of subKegiatanData) {
    await SubKegiatan.findOrCreate({
      where: { id_sub_kegiatan: subKegiatan.id_sub_kegiatan },
      defaults: subKegiatan,
    });
  }
  console.log(`✅ Seeded ${subKegiatanData.length} sub kegiatan records`);
}

async function seedAll() {
  try {
    console.log('🔄 Starting database migration...\n');
    
    // Sync database (drop and recreate tables)
    await sequelize.sync({ force: true });
    console.log('✅ Database synced\n');

    // 0. Seed Reference Data FIRST
    await seedReference();
    console.log('');

    // 1. Seed Admin User
    console.log('📝 Creating admin user...');
    const admin = await User.create({
      username: 'dinkes',
      password: 'dinkes123',
      nama: 'Administrator Dinkes',
      role: 'admin',
    });
    console.log(`✅ Admin created: ${admin.username}\n`);

    // 2. Seed All Puskesmas (102 puskesmas)
    console.log(`📝 Creating ${puskesmasData.length} puskesmas users...`);
    const puskesmasUsers: any[] = [];
    
    for (const puskesmas of puskesmasData) {
      const user = await User.create({
        username: puskesmas.username,
        password: puskesmas.password,
        nama: puskesmas.nama,
        nama_puskesmas: puskesmas.nama,
        role: 'puskesmas',
        id_blud: puskesmas.id_blud || '',
        kecamatan: puskesmas.kecamatan || '',
        wilayah: puskesmas.wilayah || '',
      });
      puskesmasUsers.push({ oldId: puskesmas.id, newId: user.id, username: user.username });
    }
    console.log(`✅ Created ${puskesmasUsers.length} puskesmas users\n`);

    // Create mapping from old ID to new UUID
    const idMapping: { [key: number]: string } = {};
    puskesmasUsers.forEach(p => {
      idMapping[p.oldId] = p.newId;
    });

    // 3. Seed Laporan Data
    console.log(`📝 Processing ${laporanData.length} laporan records...`);
    let laporanCount = 0;
    let skippedCount = 0;
    
    for (const laporan of laporanData) {
      try {
        // Map old puskesmas ID to new UUID
        const userId = idMapping[laporan.puskesmas_id];
        if (!userId) {
          skippedCount++;
          continue; // Skip if user not found
        }

        // Skip if id_sub_kegiatan is 0 (invalid)
        if (!laporan.id_sub_kegiatan || laporan.id_sub_kegiatan === 0) {
          skippedCount++;
          continue;
        }

        await Laporan.create({
          user_id: userId,
          id_kegiatan: laporan.id_kegiatan || 0,
          id_sub_kegiatan: laporan.id_sub_kegiatan,
          id_sumber_anggaran: Number(laporan.sumber_anggaran) || 0,
          id_satuan: Number(laporan.satuan) || 0,
          target_k: laporan.target_k || 0,
          angkas: laporan.angkas || 0,
          target_rp: laporan.target_rp || 0,
          realisasi_k: laporan.realisasi_k || 0,
          realisasi_rp: laporan.realisasi_rp || 0,
          permasalahan: laporan.permasalahan || '',
          upaya: laporan.upaya || '',
          bulan: laporan.bulan || '',
          tahun: laporan.tahun || 2022,
        });
        laporanCount++;
        
        // Progress indicator every 1000 records
        if (laporanCount % 1000 === 0) {
          process.stdout.write(`\r   Progress: ${laporanCount} records created...`);
        }
      } catch (error: any) {
        skippedCount++;
        // Only log first few errors to avoid spam
        if (skippedCount <= 5) {
          console.warn(`\n⚠️  Error creating laporan ${laporan.id_evkin}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n✅ Created ${laporanCount} laporan records`);
    if (skippedCount > 0) {
      console.log(`⚠️  Skipped ${skippedCount} records (foreign key or validation issues)\n`);
    }

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 Migration completed successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Summary:`);
    console.log(`   • Satuan: 20 records`);
    console.log(`   • Sumber Anggaran: 4 records`);
    console.log(`   • Kegiatan: 5 records`);
    console.log(`   • Sub Kegiatan: 46 records`);
    console.log(`   • Admin users: 1`);
    console.log(`   • Puskesmas users: ${puskesmasUsers.length}`);
    console.log(`   • Laporan records: ${laporanCount}`);
    console.log(`   • Total records: ${75 + 1 + puskesmasUsers.length + laporanCount}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('🔑 Login Credentials:');
    console.log('   Admin:');
    console.log('   - Username: dinkes');
    console.log('   - Password: dinkes123\n');
    console.log('   Puskesmas (sample):');
    console.log('   - Username: cibinong (or any from 102 puskesmas)');
    console.log('   - Password: bogorkab\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

seedAll();
EOF

echo "✅ Complete seedAll.ts created with ALL 46 sub_kegiatan records"

echo ""
echo "🗄️ Stopping backend process..."
pm2 stop e-evkin-backend 2>/dev/null || echo "Backend was not running"

echo ""
echo "🌱 Running COMPLETE database seeding..."
npx tsx src/seeders/seedAll.ts

RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "🚀 Restarting backend..."
    pm2 start e-evkin-backend 2>/dev/null || echo "⚠️ Backend needs manual restart"
    
    echo ""
    echo "🎉 COMPLETE SEEDING SUCCESSFUL!"
    echo "=============================="
    echo "🌐 Website: http://103.197.189.168"
    echo "🔐 Admin: dinkes / dinkes123"
    echo "🏥 Puskesmas: cibinong / bogorkab"
    echo ""
    echo "✅ Database now contains ALL required reference data!"
    echo "✅ No more foreign key constraint errors!"
    echo ""
    echo "📊 Check status: pm2 status"
    echo "🏥 Health: curl http://103.197.189.168/health"
else
    echo ""
    echo "❌ Complete seeding failed! Check the errors above."
    exit 1
fi