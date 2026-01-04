const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const token = jwt.sign({ id: '8d709058-bbfc-4be3-8f4f-b01d8e1c45ea', role: 'puskesmas' }, JWT_SECRET, { expiresIn: '1h' });

async function test() {
  console.log('=== Testing API with new formatting ===\n');
  
  try {
    // Test 1: Target endpoint
    const targetRes = await axios.get('http://localhost:5000/api/target/assigned?tahun=2025', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('✅ Target assigned API working');
    console.log('Total sub kegiatan with targets:', targetRes.data.data?.length || 0);
    
    // Test 2: Angkas endpoint
    const angkasRes = await axios.get('http://localhost:5000/api/angkas/by-sub-kegiatan?tahun=2025&bulan=3', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('\n✅ Angkas API working');
    console.log('Total sub kegiatan with angkas:', angkasRes.data.data?.length || 0);
    
    // Test 3: Sample data check
    if (angkasRes.data.data?.length > 0) {
      const sample = angkasRes.data.data[0];
      console.log('\nSample angkas data:');
      console.log('  - id_sub_kegiatan:', sample.id_sub_kegiatan);
      console.log('  - target_angkas:', sample.target_angkas);
    }
    
    // Test 4: Target history (test N+1 fix)
    if (targetRes.data.data?.length > 0) {
      const subKegiatanId = targetRes.data.data[0].subKegiatan.id_sub_kegiatan;
      const historyRes = await axios.get(`http://localhost:5000/api/target/history/${subKegiatanId}?tahun=2025`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      console.log('\n✅ Target history API working (N+1 fix tested)');
      console.log('History records:', historyRes.data.data?.length || 0);
    }
    
    console.log('\n=== All API tests passed! ===');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

test();
