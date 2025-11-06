#!/bin/bash

# Check what id_sub_kegiatan values are in the laporan data
echo "🔍 Analyzing laporan data for sub_kegiatan IDs..."

cd /www/wwwroot/e-evkin-modern/backend

# Check unique id_sub_kegiatan values in laporan.json
echo "📊 Unique id_sub_kegiatan values in laporan data:"
npx tsx -e "
const laporanData = require('./src/seeders/data/laporan.json');
const subKegiatanIds = laporanData.map(l => l.id_sub_kegiatan).filter(id => id != null);
const uniqueIds = [...new Set(subKegiatanIds)].sort((a, b) => a - b);
console.log('Found', uniqueIds.length, 'unique id_sub_kegiatan values:');
console.log(uniqueIds.join(', '));

// Count occurrences
const counts = {};
subKegiatanIds.forEach(id => {
  counts[id] = (counts[id] || 0) + 1;
});

console.log('\nTop 10 most used id_sub_kegiatan:');
Object.entries(counts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([id, count]) => {
    console.log(\`  \${id}: \${count} records\`);
  });
"

echo ""
echo "📚 Currently seeded sub_kegiatan IDs:"
npx tsx -e "
import { SubKegiatan } from './src/models';
async function check() {
  try {
    const subKegiatan = await SubKegiatan.findAll({
      attributes: ['id_sub_kegiatan'],
      order: [['id_sub_kegiatan', 'ASC']]
    });
    const ids = subKegiatan.map(s => s.id_sub_kegiatan);
    console.log('Currently in database:', ids.join(', '));
  } catch (error) {
    console.log('Error checking database:', error.message);
  }
  process.exit(0);
}
check();
"