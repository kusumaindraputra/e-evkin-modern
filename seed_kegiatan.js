/**
 * Seed kegiatan mapping from Rekap_Ver3.xlsx
 * Creates new kegiatan records and updates sub_kegiatan.id_kegiatan
 * Run on production: node seed_kegiatan.js
 */
require('dotenv').config({ path: './backend/.env.production' });
const seq = require("./backend/dist/config/database").default;

// Mapping: kode_kegiatan → nama_kegiatan
const KEGIATAN_MAP = {
  '1.02.01.2.10': 'Peningkatan Pelayanan BLUD',
  '1.02.02.2.02': 'Penyediaan Layanan Kesehatan untuk UKM dan UKP Rujukan Tingkat Daerah Kabupaten/Kota',
  '1.02.05.2.01': 'Advokasi, Pemberdayaan, Kemitraan, Peningkatan Peran serta Masyarakat dan Lintas Sektor Tingkat Daerah Kabupaten/Kota',
  '1.02.05.2.03': 'Pengembangan dan Pelaksanaan Upaya Kesehatan Bersumber Daya Masyarakat (UKBM) Tingkat Daerah Kabupaten/Kota',
};

// Mapping: kode_sub → kode_kegiatan parent
const SUB_TO_KEG = {
  '1.02.01.2.10.0001': '1.02.01.2.10',
  '1.02.02.2.02.0001': '1.02.02.2.02',
  '1.02.02.2.02.0005': '1.02.02.2.02',
  '1.02.02.2.02.0010': '1.02.02.2.02',
  '1.02.02.2.02.0011': '1.02.02.2.02',
  '1.02.02.2.02.0015': '1.02.02.2.02',
  '1.02.02.2.02.0017': '1.02.02.2.02',
  '1.02.02.2.02.0020': '1.02.02.2.02',
  '1.02.02.2.02.0021': '1.02.02.2.02',
  '1.02.02.2.02.0025': '1.02.02.2.02',
  '1.02.02.2.02.0033': '1.02.02.2.02',
  '1.02.02.2.02.0034': '1.02.02.2.02',
  '1.02.02.2.02.0046': '1.02.02.2.02',
  '1.02.02.2.02.0048': '1.02.02.2.02',
  '1.02.05.2.01.0001': '1.02.05.2.01',
  '1.02.05.2.03.0001': '1.02.05.2.03',
};

async function main() {
  await seq.authenticate();
  console.log('Connected to DB');

  const t = await seq.transaction();
  try {
    // 1. Create kegiatan records (upsert by kode)
    const kegIdMap = {}; // kode → id_kegiatan
    for (const [kode, nama] of Object.entries(KEGIATAN_MAP)) {
      // Check if exists
      const [existing] = await seq.query(
        'SELECT id_kegiatan FROM kegiatan WHERE kode = $1',
        { bind: [kode], transaction: t }
      );

      if (existing.length > 0) {
        kegIdMap[kode] = existing[0].id_kegiatan;
        console.log(`  EXISTS: ${kode} → id=${existing[0].id_kegiatan}`);
      } else {
        const [result] = await seq.query(
          'INSERT INTO kegiatan (kode, kegiatan, id_uraian, created_at, updated_at) VALUES ($1, $2, 0, NOW(), NOW()) RETURNING id_kegiatan',
          { bind: [kode, nama], transaction: t }
        );
        kegIdMap[kode] = result[0].id_kegiatan;
        console.log(`  CREATED: ${kode} → id=${result[0].id_kegiatan} | ${nama.substring(0, 60)}`);
      }
    }

    // 2. Update sub_kegiatan.id_kegiatan based on kode_sub
    let updated = 0;
    for (const [kodeSub, kodeKeg] of Object.entries(SUB_TO_KEG)) {
      const kegId = kegIdMap[kodeKeg];
      if (!kegId) {
        console.log(`  SKIP: ${kodeSub} - no kegiatan id for ${kodeKeg}`);
        continue;
      }

      const [result] = await seq.query(
        'UPDATE sub_kegiatan SET id_kegiatan = $1, updated_at = NOW() WHERE kode_sub = $2 AND id_kegiatan != $1',
        { bind: [kegId, kodeSub], transaction: t }
      );

      if (result[1] > 0) {
        updated++;
        console.log(`  UPDATED: ${kodeSub} → kegiatan_id=${kegId}`);
      }
    }

    await t.commit();
    console.log(`\nDone! Updated ${updated} sub_kegiatan records`);

    // Verify
    const [verify] = await seq.query(`
      SELECT sk.kode_sub, sk.id_kegiatan, k.kode as keg_kode, k.kegiatan as keg_nama
      FROM sub_kegiatan sk
      LEFT JOIN kegiatan k ON sk.id_kegiatan = k.id_kegiatan
      WHERE sk.kode_sub LIKE '1.02.%'
      ORDER BY sk.kode_sub
    `);
    console.log('\n=== VERIFICATION ===');
    for (const row of verify) {
      console.log(`  ${row.kode_sub} → [${row.keg_kode}] ${(row.keg_nama || 'NULL').substring(0, 50)}`);
    }
  } catch (err) {
    await t.rollback();
    console.error('ROLLBACK:', err);
  }

  await seq.close();
}

main().catch(console.error);
