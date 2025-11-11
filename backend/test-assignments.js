const { SubKegiatanSumberAnggaran, SumberAnggaran } = require('./src/models');

(async () => {
  try {
    const result = await SubKegiatanSumberAnggaran.findAll({ 
      where: { id_sub_kegiatan: 1 },
      include: [{ 
        model: SumberAnggaran, 
        as: 'sumberAnggaran',
        attributes: ['id_sumber', 'sumber']
      }]
    });
    
    console.log(`Found ${result.length} sumber anggaran for sub_kegiatan 1:`);
    result.forEach(r => {
      console.log(`- ${r.sumberAnggaran.sumber} (ID: ${r.sumberAnggaran.id_sumber})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
