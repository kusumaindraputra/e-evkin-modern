const { sequelize, SubKegiatanSumberAnggaran, SumberAnggaran, SubKegiatan } = require('./src/models');

async function checkData() {
  try {
    // Count total assignments
    const count = await SubKegiatanSumberAnggaran.count();
    console.log(`\n📊 Total assignments: ${count}`);
    
    // Get assignments for first 3 sub kegiatan
    for (let i = 1; i <= 3; i++) {
      const assignments = await SubKegiatanSumberAnggaran.findAll({
        where: { id_sub_kegiatan: i },
        include: [
          { 
            model: SubKegiatan, 
            as: 'subKegiatan',
            attributes: ['kegiatan']
          },
          { 
            model: SumberAnggaran, 
            as: 'sumberAnggaran',
            attributes: ['sumber']
          }
        ]
      });
      
      console.log(`\n🎯 Sub Kegiatan ${i} (${assignments[0]?.subKegiatan?.kegiatan || 'N/A'}):`);
      console.log(`   Assigned sumber anggaran: ${assignments.length}`);
      
      assignments.slice(0, 3).forEach(a => {
        console.log(`   - ${a.sumberAnggaran.sumber}`);
      });
      if (assignments.length > 3) {
        console.log(`   ... and ${assignments.length - 3} more`);
      }
    }
    
    console.log('\n✅ Check complete\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkData();
