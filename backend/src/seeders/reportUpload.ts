import { AnggaranKas, User, SubKegiatanTarget } from '../models';
import { Op } from 'sequelize';

async function report() {
  console.log('=== LAPORAN UPLOAD DATA ===\n');
  
  // 1. SubKegiatanTarget summary
  const targets = await SubKegiatanTarget.count();
  const targetsByPuskesmas = await SubKegiatanTarget.count({ 
    group: ['user_id'],
    col: 'user_id'
  });
  console.log('SubKegiatanTarget (Excel):');
  console.log('  Total records:', targets);
  console.log('  Puskesmas dengan target:', targetsByPuskesmas.length);
  
  // 2. AnggaranKas summary
  const angkas = await AnggaranKas.count();
  const angkasByPuskesmas = await AnggaranKas.count({
    group: ['user_id'],
    col: 'user_id'
  });
  console.log('\nAnggaranKas (PDF):');
  console.log('  Total records:', angkas);
  console.log('  Puskesmas dengan angkas:', angkasByPuskesmas.length);
  
  // 3. Puskesmas tanpa angkas
  const puskesmasWithAngkas = angkasByPuskesmas.map((p: any) => p.user_id);
  const puskesmasWithoutAngkas = await User.findAll({
    where: {
      role: 'puskesmas',
      id: { [Op.notIn]: puskesmasWithAngkas.length > 0 ? puskesmasWithAngkas : ['none'] }
    },
    attributes: ['id', 'nama', 'kode_sub_unit'],
    order: [['kode_sub_unit', 'ASC']]
  });
  
  console.log('\n=== PUSKESMAS TANPA DATA ANGKAS ===');
  console.log('Total:', puskesmasWithoutAngkas.length, 'puskesmas');
  puskesmasWithoutAngkas.forEach(p => {
    console.log(` - ${p.kode_sub_unit} - ${p.nama}`);
  });
  
  // 4. Puskesmas tanpa target
  const puskesmasWithTarget = targetsByPuskesmas.map((p: any) => p.user_id);
  const puskesmasWithoutTarget = await User.findAll({
    where: {
      role: 'puskesmas',
      id: { [Op.notIn]: puskesmasWithTarget.length > 0 ? puskesmasWithTarget : ['none'] }
    },
    attributes: ['id', 'nama', 'kode_sub_unit'],
    order: [['kode_sub_unit', 'ASC']]
  });
  
  console.log('\n=== PUSKESMAS TANPA DATA TARGET ===');
  console.log('Total:', puskesmasWithoutTarget.length, 'puskesmas');
  puskesmasWithoutTarget.forEach(p => {
    console.log(` - ${p.kode_sub_unit} - ${p.nama}`);
  });
  
  // 5. Summary DINAS KESEHATAN
  console.log('\n=== CATATAN ===');
  console.log('1. DINAS KESEHATAN (kode 1.02.0.00.0.00.01.0000) sengaja diabaikan');
  console.log('   karena bukan merupakan Puskesmas.');
  console.log('2. Data dengan nilai 0 di PDF tidak disimpan (skipped).');
}

report().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
