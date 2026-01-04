import { SubKegiatanTarget, AnggaranKas, Laporan, sequelize } from '../models';

async function clearData() {
  try {
    console.log('=== Clearing existing data ===');
    
    const targetCount = await SubKegiatanTarget.count();
    const angkasCount = await AnggaranKas.count();
    const laporanCount = await Laporan.count();
    
    console.log('Before clear:');
    console.log('- SubKegiatanTarget:', targetCount);
    console.log('- AnggaranKas:', angkasCount);
    console.log('- Laporan:', laporanCount);
    
    // Clear data
    await SubKegiatanTarget.destroy({ where: {}, force: true });
    await AnggaranKas.destroy({ where: {}, force: true });
    await Laporan.destroy({ where: {}, force: true });
    
    console.log('\nAfter clear:');
    console.log('- SubKegiatanTarget:', await SubKegiatanTarget.count());
    console.log('- AnggaranKas:', await AnggaranKas.count());
    console.log('- Laporan:', await Laporan.count());
    console.log('\n=== Data cleared successfully ===');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error clearing data:', error);
    await sequelize.close();
    process.exit(1);
  }
}

clearData();
