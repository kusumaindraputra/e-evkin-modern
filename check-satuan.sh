#!/bin/bash

# Check and fix id_satuan issues
echo "🔍 Analyzing laporan data for satuan IDs..."

cd /www/wwwroot/e-evkin-modern/backend

echo "📊 Unique id_satuan values in laporan data:"
npx tsx -e "
const laporanData = require('./src/seeders/data/laporan.json');
const satuanIds = laporanData.map(l => Number(l.satuan)).filter(id => id != null && !isNaN(id));
const uniqueIds = [...new Set(satuanIds)].sort((a, b) => a - b);
console.log('Found', uniqueIds.length, 'unique id_satuan values:');
console.log(uniqueIds.join(', '));

// Count occurrences
const counts = {};
satuanIds.forEach(id => {
  counts[id] = (counts[id] || 0) + 1;
});

console.log('\nTop 10 most used id_satuan:');
Object.entries(counts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([id, count]) => {
    console.log(\`  \${id}: \${count} records\`);
  });
"

echo ""
echo "📚 Currently seeded satuan IDs:"
npx tsx -e "
import { Satuan } from './src/models';
async function check() {
  try {
    const satuan = await Satuan.findAll({
      attributes: ['id_satuan', 'satuannya'],
      order: [['id_satuan', 'ASC']]
    });
    console.log('Currently in database:');
    satuan.forEach(s => {
      console.log(\`  \${s.id_satuan}: \${s.satuannya}\`);
    });
  } catch (error) {
    console.log('Error checking database:', error.message);
  }
  process.exit(0);
}
check();
"