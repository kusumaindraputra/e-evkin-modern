/**
 * One-time migration: add bulan_penetapan and tanggal_penetapan columns
 * Usage: npx tsx src/scripts/migrate_bulan_penetapan.ts
 */
import { sequelize } from '../config/database';
import { DataTypes } from 'sequelize';

async function run() {
  await sequelize.authenticate();
  console.log('Connected');

  const qi = sequelize.getQueryInterface();

  // Check and add bulan_penetapan
  const [cols1] = await sequelize.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='sub_kegiatan_target' AND column_name='bulan_penetapan'"
  );
  if ((cols1 as any[]).length > 0) {
    console.log('Column bulan_penetapan already exists, skipping');
  } else {
    await qi.addColumn('sub_kegiatan_target', 'bulan_penetapan', {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Bulan penetapan (1-12), null = berlaku dari awal tahun',
    });
    console.log('Done: bulan_penetapan column added');
  }

  // Check and add tanggal_penetapan
  const [cols2] = await sequelize.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='sub_kegiatan_target' AND column_name='tanggal_penetapan'"
  );
  if ((cols2 as any[]).length > 0) {
    console.log('Column tanggal_penetapan already exists, skipping');
  } else {
    await qi.addColumn('sub_kegiatan_target', 'tanggal_penetapan', {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Tanggal resmi penetapan anggaran',
    });
    console.log('Done: tanggal_penetapan column added');
  }

  await sequelize.close();
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
