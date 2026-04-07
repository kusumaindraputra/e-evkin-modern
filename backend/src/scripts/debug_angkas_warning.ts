import sequelize from '../config/database';
import User from '../models/User';
import SubKegiatan from '../models/SubKegiatan';
import SubKegiatanTarget from '../models/SubKegiatanTarget';
import AnggaranKas from '../models/AnggaranKas';

async function debug() {
  await sequelize.authenticate();

  // 1. Find Bojong Gede user
  const user = await User.findOne({ where: { username: 'bojonggede' }, attributes: ['id', 'nama', 'username'] });
  if (!user) {
    // Try other patterns
    const users = await User.findAll({ attributes: ['id', 'nama', 'username'], where: sequelize.where(sequelize.fn('LOWER', sequelize.col('nama')), 'LIKE', '%bojong%gede%') });
    console.log('Users matching bojong gede:', users.map(u => ({ id: u.id, nama: u.nama, username: u.username })));
    if (!users.length) { console.log('No user found'); process.exit(0); }
  }
  const userId = user?.id || '';
  console.log('User:', user?.nama, user?.username, userId);

  // 2. Find sub kegiatan
  const sub = await SubKegiatan.findOne({ where: { kode_sub: '1.02.02.2.02.0033' }, attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan'] });
  console.log('SubKegiatan:', sub?.id_sub_kegiatan, sub?.kode_sub);
  if (!sub) { console.log('Sub kegiatan not found'); process.exit(0); }
  const subId = sub.id_sub_kegiatan;

  // 3. Check targets - how many sumber anggaran?
  const targets = await SubKegiatanTarget.findAll({
    where: { user_id: userId, id_sub_kegiatan: subId, tahun: 2026 },
    attributes: ['id', 'id_sub_kegiatan', 'id_sumber_anggaran', 'target_k', 'target_rp'],
  });
  console.log('Targets (sumber count =', targets.length, '):');
  targets.forEach(t => console.log('  sumber:', t.id_sumber_anggaran, 'target_k:', t.target_k, 'target_rp:', Number(t.target_rp)));

  // 4. Check angkas_kas entries
  const angkas = await AnggaranKas.findAll({
    where: { user_id: userId, id_sub_kegiatan: subId, tahun: 2026 },
    attributes: ['id', 'id_sumber_anggaran', 'bulan', 'nilai'],
    order: [['id_sumber_anggaran', 'ASC'], ['bulan', 'ASC']],
  });
  console.log('AnggaranKas entries:', angkas.length);
  angkas.forEach(a => console.log('  sumber:', a.id_sumber_anggaran, 'bulan:', a.bulan, 'nilai:', Number(a.nilai)));

  // 5. isManualAngkas would be: targets.length > 1
  console.log('\nisManualAngkas:', targets.length > 1);
  console.log('Has angkas_kas data:', angkas.length > 0);

  await sequelize.close();
}

debug().catch(e => { console.error(e); process.exit(1); });
