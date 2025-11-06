import { sequelize } from '../config/database';
import User from '../models/User';
import Laporan from '../models/Laporan';
import puskesmasData from './data/puskesmas.json';
import laporanDataRaw from './data/laporan.json';

const laporanData = laporanDataRaw as any[];

async function seedAll() {
  try {
    console.log('🔄 Starting database migration...\n');
    
    // Sync database (drop and recreate tables)
    await sequelize.sync({ force: true });
    console.log('✅ Database synced\n');

    // 1. Seed Admin User
    console.log('📝 Creating admin user...');
    const admin = await User.create({
      username: 'dinkes',
      password: 'dinkes',
      nama: 'Administrator Dinkes',
      role: 'admin',
    });
    console.log(`✅ Admin created: ${admin.username}\n`);

    // 2. Seed All Puskesmas (102 puskesmas)
    console.log(`📝 Creating ${puskesmasData.length} puskesmas users...`);
    const puskesmasUsers: any[] = [];
    
    for (const puskesmas of puskesmasData) {
      const user = await User.create({
        username: puskesmas.username,
        password: puskesmas.password,
        nama: puskesmas.nama,
        nama_puskesmas: puskesmas.nama,
        role: 'puskesmas',
        id_blud: puskesmas.id_blud || '',
        kecamatan: puskesmas.kecamatan || '',
        wilayah: puskesmas.wilayah || '',
      });
      puskesmasUsers.push({ oldId: puskesmas.id, newId: user.id, username: user.username });
    }
    console.log(`✅ Created ${puskesmasUsers.length} puskesmas users\n`);

    // Create mapping from old ID to new UUID
    const idMapping: { [key: number]: string } = {};
    puskesmasUsers.forEach(p => {
      idMapping[p.oldId] = p.newId;
    });

    // 3. Seed Laporan Data
    console.log(`📝 Processing ${laporanData.length} laporan records...`);
    let laporanCount = 0;
    let skippedCount = 0;
    
    for (const laporan of laporanData) {
      try {
        // Map old puskesmas ID to new UUID
        const userId = idMapping[laporan.puskesmas_id];
        if (!userId) {
          skippedCount++;
          continue; // Skip silently
        }

        await Laporan.create({
          user_id: userId,
          id_kegiatan: laporan.id_kegiatan || 0,
          id_sub_kegiatan: laporan.id_sub_kegiatan || 0,
          id_sumber_anggaran: Number(laporan.sumber_anggaran) || 0,
          id_satuan: Number(laporan.satuan) || 0,
          target_k: laporan.target_k || 0,
          angkas: laporan.angkas || 0,
          target_rp: laporan.target_rp || 0,
          realisasi_k: laporan.realisasi_k || 0,
          realisasi_rp: laporan.realisasi_rp || 0,
          permasalahan: laporan.permasalahan || '',
          upaya: laporan.upaya || '',
          bulan: laporan.bulan || '',
          tahun: laporan.tahun || 2022,
        });
        laporanCount++;
        
        // Progress indicator every 100 records
        if (laporanCount % 100 === 0) {
          process.stdout.write(`\r   Progress: ${laporanCount} records created...`);
        }
      } catch (error: any) {
        console.warn(`\n⚠️  Error creating laporan ${laporan.id_evkin}: ${error.message}`);
      }
    }
    console.log(`\n✅ Created ${laporanCount} laporan records`);
    if (skippedCount > 0) {
      console.log(`⚠️  Skipped ${skippedCount} records (invalid puskesmas_id)\n`);
    }

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 Migration completed successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Summary:`);
    console.log(`   • Admin users: 1`);
    console.log(`   • Puskesmas users: ${puskesmasUsers.length}`);
    console.log(`   • Laporan records: ${laporanCount}`);
    console.log(`   • Total records: ${1 + puskesmasUsers.length + laporanCount}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('🔑 Login Credentials:');
    console.log('   Admin:');
    console.log('   - Username: dinkes');
    console.log('   - Password: dinkes\n');
    console.log('   Puskesmas (sample):');
    console.log('   - Username: bojonggede (or any from 102 puskesmas)');
    console.log('   - Password: bogorkab\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

seedAll();
