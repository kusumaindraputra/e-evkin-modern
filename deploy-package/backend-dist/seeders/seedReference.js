"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
async function seedReference() {
    try {
        // Don't sync here - let the main seeder handle it
        // await sequelize.sync({ force: false });
        console.log('Seeding reference data...');
        // Seed Satuan
        console.log('Seeding satuan...');
        const satuanData = [
            { id_satuan: 1, satuannya: 'Orang' },
            { id_satuan: 2, satuannya: 'Dokumen' },
            { id_satuan: 3, satuannya: 'unit kerja' },
            { id_satuan: 7, satuannya: 'Laporan' },
            { id_satuan: 8, satuannya: 'Kegiatan' },
        ];
        for (const satuan of satuanData) {
            await models_1.Satuan.findOrCreate({
                where: { id_satuan: satuan.id_satuan },
                defaults: satuan,
            });
        }
        console.log(`✓ Seeded ${satuanData.length} satuan records`);
        // Seed Sumber Anggaran
        console.log('Seeding sumber anggaran...');
        const sumberAnggaranData = [
            { id_sumber: 1, sumber: 'BLUD Puskesmas' },
            { id_sumber: 2, sumber: 'DAK Non Fisik' },
            { id_sumber: 3, sumber: 'APBD' },
            { id_sumber: 4, sumber: 'JKN (Dana Kapitasi)' },
        ];
        for (const sumber of sumberAnggaranData) {
            await models_1.SumberAnggaran.findOrCreate({
                where: { id_sumber: sumber.id_sumber },
                defaults: sumber,
            });
        }
        console.log(`✓ Seeded ${sumberAnggaranData.length} sumber anggaran records`);
        // Seed Kegiatan
        console.log('Seeding kegiatan...');
        const kegiatanData = [
            { id_kegiatan: 1, id_uraian: 2, kode: '1.02.01.2.10', kegiatan: 'Peningkatan Pelayanan BLUD' },
            { id_kegiatan: 2, id_uraian: 3, kode: '1.02.02.2.02', kegiatan: 'Penyediaan Layanan Kesehatan untuk UKM dan UKP Rujukan Tingkat Daerah Kabupaten/Kota' },
            { id_kegiatan: 3, id_uraian: 4, kode: '1.02.03.2.02', kegiatan: 'Perencanaan Kebutuhan dan Pendayagunaan Sumberdaya Manusia Kesehatan untuk UKP dan UKM di Wilayah Kabupaten/Kota' },
            { id_kegiatan: 4, id_uraian: 5, kode: '1.02.05.2.03', kegiatan: 'Pengembangan dan Pelaksanaan Upaya Kesehatan Bersumber Daya Masyarakat (UKBM) Tingkat Daerah Kabupaten/Kota' },
            { id_kegiatan: 5, id_uraian: 3, kode: '1.02.02.2.03', kegiatan: 'Penyelenggaraan Sistem Informasi Kesehatan Secara Terintegrasi' },
        ];
        for (const kegiatan of kegiatanData) {
            await models_1.Kegiatan.findOrCreate({
                where: { id_kegiatan: kegiatan.id_kegiatan },
                defaults: kegiatan,
            });
        }
        console.log(`✓ Seeded ${kegiatanData.length} kegiatan records`);
        // Seed Sub Kegiatan
        console.log('Seeding sub kegiatan...');
        const subKegiatanData = [
            { id_sub_kegiatan: 1, id_kegiatan: 1, kode_sub: '1.02.01.2.10.0001', kegiatan: 'Pelayanan dan Penunjang Pelayanan BLUD', indikator_kinerja: 'Jumlah BLUD yang menyediakan pelayanan dan penunjang pelayanan' },
            { id_sub_kegiatan: 2, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0001', kegiatan: 'Pengelolaan Pelayanan Kesehatan Ibu Hamil', indikator_kinerja: 'Jumlah ibu hamil yang mendapatkan pelayanan kesehatan sesuai standar' },
            { id_sub_kegiatan: 4, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0002', kegiatan: 'Pengelolaan Pelayanan Kesehatan Ibu Bersalin', indikator_kinerja: 'Jumlah ibu bersalin yang mendapatkan pelayanan kesehatan sesuai standar' },
            { id_sub_kegiatan: 7, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0005', kegiatan: 'Pengelolaan Pelayanan Kesehatan pada Usia Pendidikan Dasar', indikator_kinerja: 'Jumlah anak usia pendidikan dasar yang mendapatkan pelayanan kesehatan sesuai standar' },
            { id_sub_kegiatan: 13, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0011', kegiatan: 'Pengelolaan Pelayanan Kesehatan Orang Terduga Tuberkulosis', indikator_kinerja: 'Jumlah orang terduga menderita tuberkulosis yang mendapatkan pelayanan sesuai standar' },
            { id_sub_kegiatan: 14, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0012', kegiatan: 'Pengelolaan Pelayanan Kesehatan Orang dengan Risiko Terinfeksi HIV', indikator_kinerja: 'Jumlah orang terduga menderita HIV yang mendapatkan pelayanan sesuai standar' },
            { id_sub_kegiatan: 17, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0015', kegiatan: 'Pengelolaan Pelayanan Kesehatan Gizi Masyarakat', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan pelayanan kesehatan gizi masyarakat' },
            { id_sub_kegiatan: 19, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0017', kegiatan: 'Pengelolaan Pelayanan Kesehatan Lingkungan', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan pelayanan kesehatan lingkungan' },
            { id_sub_kegiatan: 22, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0020', kegiatan: 'Pengelolaan Surveilans Kesehatan', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan pelayanan surveilans kesehatan' },
            { id_sub_kegiatan: 25, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0025', kegiatan: 'Pelayanan Kesehatan Penyakit Menular dan Tidak Menular', indikator_kinerja: 'Jumlah dokumen hasil pelayanan kesehatan penyakit menular dan tidak menular' },
            { id_sub_kegiatan: 30, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0033', kegiatan: 'Operasional Pelayanan Puskesmas', indikator_kinerja: 'Jumlah laporan operasional pelayanan puskesmas' },
            { id_sub_kegiatan: 31, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0034', kegiatan: 'Operasional Pelayanan Fasilitas Kesehatan Lainnya', indikator_kinerja: 'Jumlah dokumen operasional fasilitas kesehatan lainnya' },
            { id_sub_kegiatan: 33, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0036', kegiatan: 'Investigasi Awal Kejadian Tidak Diharapkan (Kejadian Ikutan Pasca Imunisasi dan Pemberian Obat Massal)', indikator_kinerja: 'Jumlah laporan hasil investigasi awal kejadian tidak diharapkan (kejadian ikutan pasca imunisasi dan pemberian obat massal)' },
            { id_sub_kegiatan: 37, id_kegiatan: 4, kode_sub: '1.02.05.2.03.0001', kegiatan: 'Bimbingan Teknis dan Supervisi Pengembangan dan Pelaksanaan Upaya Kesehatan Bersumber Daya Masyarakat (UKBM)', indikator_kinerja: 'Jumlah peserta yang mendapatkan  Bimbingan Teknis dan Supervisi Pengembangan dan Pelaksanaan Upaya Kesehatan Bersumber Daya Masyarakat (UKBM)' },
            { id_sub_kegiatan: 38, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0040', kegiatan: 'Pengelolaan kesehatan Orang dengan Tuberkulosis', indikator_kinerja: 'Jumlah orang dengan Tuberkulosis yang mendapatkan pelayanan kesehatan sesuai standar' },
            { id_sub_kegiatan: 40, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0041', kegiatan: 'Pengelolaan pelayanan kesehatan orang dengan HIV (ODHIV)', indikator_kinerja: 'Jumlah orang dengan HIV (ODHIV) yang mendapatkan pelayanan kesehatan sesuai standar' },
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
            await models_1.SubKegiatan.findOrCreate({
                where: { id_sub_kegiatan: subKegiatan.id_sub_kegiatan },
                defaults: subKegiatan,
            });
        }
        console.log(`✓ Seeded ${subKegiatanData.length} sub kegiatan records`);
        console.log('\n✅ Reference data seeding completed successfully!');
        console.log(`Total records created:
  - Satuan: ${satuanData.length}
  - Sumber Anggaran: ${sumberAnggaranData.length}
  - Kegiatan: ${kegiatanData.length}
  - Sub Kegiatan: ${subKegiatanData.length}`);
    }
    catch (error) {
        console.error('❌ Error seeding reference data:', error);
        throw error;
    }
}
// Run if called directly
if (require.main === module) {
    seedReference()
        .then(() => {
        console.log('Seeding complete, exiting...');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
    });
}
exports.default = seedReference;
//# sourceMappingURL=seedReference.js.map