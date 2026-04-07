/**
 * Check current kegiatan/sub_kegiatan mapping in database
 * Usage: npx tsx src/scripts/check_kegiatan_mapping.ts
 */
import sequelize from '../config/database';

async function main() {
  await sequelize.authenticate();

  const [subs] = await sequelize.query('SELECT id_sub_kegiatan, id_kegiatan, kode_sub, kegiatan FROM sub_kegiatan ORDER BY kode_sub');
  console.log('=== SUB KEGIATAN IN DB ===');
  console.log('Count:', (subs as any[]).length);
  for (const s of subs as any[]) {
    console.log(`  ${s.id_sub_kegiatan} | id_keg=${s.id_kegiatan} | ${s.kode_sub} | ${s.kegiatan}`);
  }

  const [kegs] = await sequelize.query('SELECT id_kegiatan, kode, kegiatan FROM kegiatan ORDER BY kode');
  console.log('\n=== KEGIATAN IN DB ===');
  console.log('Count:', (kegs as any[]).length);
  for (const k of kegs as any[]) {
    console.log(`  ${k.id_kegiatan} | ${k.kode} | ${k.kegiatan}`);
  }

  const [orphans] = await sequelize.query("SELECT COUNT(*) as cnt FROM sub_kegiatan WHERE id_kegiatan = 0 OR id_kegiatan IS NULL");
  console.log('\nOrphans (id_kegiatan=0/NULL):', (orphans as any[])[0].cnt);

  await sequelize.close();
}

main().catch(console.error);
