const { Sequelize } = require('sequelize');

// Database config langsung
const sequelize = new Sequelize(
  'evkin_db',
  'postgres',
  'admin',
  {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false,
  }
);

async function checkTargetData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Get Bojonggede user ID
    const [users] = await sequelize.query(
      "SELECT id, username, nama, nama_puskesmas FROM users WHERE LOWER(nama_puskesmas) LIKE '%bojonggede%' OR LOWER(username) LIKE '%bojonggede%' LIMIT 5"
    );
    
    console.log('\n📋 Bojonggede Users:');
    users.forEach(u => {
      console.log(`  - ID: ${u.id}, Username: ${u.username}, Nama: ${u.nama}, Puskesmas: ${u.nama_puskesmas}`);
    });

    if (users.length > 0) {
      const bojonggedeId = users[0].id;
      
      // Check targets for this user
      const [targets] = await sequelize.query(
        `SELECT 
          skt.id, 
          skt.user_id, 
          skt.id_sub_kegiatan,
          skt.id_sumber_anggaran,
          skt.target_k,
          skt.target_rp,
          skt.tahun,
          skt.created_at,
          sk.kegiatan as sub_kegiatan_nama
        FROM sub_kegiatan_target skt
        LEFT JOIN sub_kegiatan sk ON skt.id_sub_kegiatan = sk.id_sub_kegiatan
        WHERE skt.user_id = :userId
        AND skt.bulan IS NULL
        ORDER BY skt.created_at DESC
        LIMIT 10`,
        {
          replacements: { userId: bojonggedeId }
        }
      );

      console.log(`\n🎯 Targets untuk user_id ${bojonggedeId}:`);
      if (targets.length === 0) {
        console.log('  ❌ TIDAK ADA TARGET!');
      } else {
        targets.forEach(t => {
          console.log(`  - ID: ${t.id}, Sub Kegiatan: ${t.sub_kegiatan_nama}, Sumber: ${t.id_sumber_anggaran}, Target K: ${t.target_k}, Target Rp: ${t.target_rp}, Tahun: ${t.tahun}`);
        });
      }

      // Check all targets (to see if admin created with wrong user_id)
      const [allTargets] = await sequelize.query(
        `SELECT 
          skt.id,
          skt.user_id,
          u.nama_puskesmas,
          skt.id_sub_kegiatan,
          sk.kegiatan as sub_kegiatan_nama,
          skt.tahun,
          skt.target_k
        FROM sub_kegiatan_target skt
        LEFT JOIN users u ON skt.user_id = u.id
        LEFT JOIN sub_kegiatan sk ON skt.id_sub_kegiatan = sk.id_sub_kegiatan
        WHERE skt.bulan IS NULL
        AND skt.tahun = 2025
        ORDER BY skt.created_at DESC
        LIMIT 20`
      );

      console.log(`\n📊 Semua Targets di tahun 2025:`);
      allTargets.forEach(t => {
        console.log(`  - User ID: ${t.user_id}, Puskesmas: ${t.nama_puskesmas}, Sub Kegiatan: ${t.sub_kegiatan_nama}, Target K: ${t.target_k}`);
      });
    }

    await sequelize.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTargetData();
