import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import { sequelize } from '../config/database';
import User from '../models/User';
import Laporan from '../models/Laporan';
import seedReference from './seedReference';
import * as fs from 'fs';

async function seed2025() {
  try {
    console.log('🔄 Starting 2025 data migration...\n');
    
    // Sync database (drop and recreate tables)
    await sequelize.sync({ force: true });
    console.log('✅ Database synced\n');

    // Seed reference data first
    console.log('📚 Seeding reference data...');
    await seedReference();
    console.log('✅ Reference data seeded\n');

    // Read JSON files
    const puskesmasData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'puskesmas.json'), 'utf-8')
    );
    const laporanDataRaw = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'laporan.json'), 'utf-8')
    );

    // 1. Seed Admin User
    console.log('📝 Creating admin user...');
    const hashedPassword = await User.hashPassword('dinkes');
    console.log('🔐 Hashed password (first 20 chars):', hashedPassword.substring(0, 20));
    
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
      
      // Get values from Sequelize instance
      puskesmasUsers.push({ 
        oldId: puskesmas.id, 
        newId: user.getDataValue('id'),
        username: user.getDataValue('username')
      });
    }
    console.log(`✅ Created ${puskesmasUsers.length} puskesmas users\n`);

    // Create mapping from old ID to new UUID
    const idMapping: { [key: number]: string } = {};
    puskesmasUsers.forEach(p => {
      idMapping[p.oldId] = p.newId;
    });

    console.log('🔍 ID Mapping check:');
    console.log(`   Mapping keys: ${Object.keys(idMapping).slice(0, 5).join(', ')}...`);
    console.log(`   First user: oldId=${puskesmasUsers[0].oldId}, newId=${puskesmasUsers[0].newId}, username=${puskesmasUsers[0].username}`);
    console.log(`   Mapping[1] exists: ${!!idMapping[1]}`);
    if (idMapping[1]) {
      console.log(`   Mapping[1] value: ${idMapping[1]}\n`);
    } else {
      console.log(`   ERROR: idMapping[1] is ${idMapping[1]}\n`);
    }

    // 3. Filter and Seed Laporan 2025 Only
    const laporanData2025 = laporanDataRaw.filter((l: any) => l.tahun === 2025);
    console.log(`📝 Processing ${laporanData2025.length} laporan records (year 2025 only)...`);
    
    let laporanCount = 0;
    let skippedCount = 0;
    const skippedIds = new Set<number>();
    
    for (const laporan of laporanData2025) {
      try {
        // Map old puskesmas ID to new UUID
        const userId = idMapping[laporan.puskesmas_id];
        if (!userId) {
          skippedCount++;
          skippedIds.add(laporan.puskesmas_id);
          continue;
        }

        await Laporan.create({
          user_id: userId,
          id_kegiatan: laporan.id_kegiatan || 0,
          id_sub_kegiatan: laporan.id_sub_kegiatan || 0,
          id_sumber_anggaran: parseInt(laporan.sumber_anggaran) || 1,
          id_satuan: parseInt(laporan.satuan) || 1,
          target_k: laporan.target_k || 0,
          angkas: laporan.angkas || 0,
          target_rp: laporan.target_rp || 0,
          realisasi_k: laporan.realisasi_k || 0,
          realisasi_rp: laporan.realisasi_rp || 0,
          permasalahan: laporan.permasalahan || '',
          upaya: laporan.upaya || '',
          bulan: laporan.bulan || '',
          tahun: laporan.tahun || 2025,
        });
        laporanCount++;
        
        // Progress indicator every 50 records
        if (laporanCount % 50 === 0) {
          process.stdout.write(`\r   Progress: ${laporanCount}/${laporanData2025.length} records created...`);
        }
      } catch (error: any) {
        console.warn(`\n⚠️  Error creating laporan ${laporan.id_evkin}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Created ${laporanCount} laporan records`);
    if (skippedCount > 0) {
      console.log(`⚠️  Skipped ${skippedCount} records (invalid puskesmas_id)`);
      console.log(`   Skipped IDs: ${Array.from(skippedIds).sort((a,b) => a-b).slice(0, 20).join(', ')}${skippedIds.size > 20 ? '...' : ''}\n`);
    }

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 Migration completed successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Summary:`);
    console.log(`   • Admin users: 1`);
    console.log(`   • Puskesmas users: ${puskesmasUsers.length}`);
    console.log(`   • Laporan records (2025): ${laporanCount}`);
    console.log(`   • Total records: ${1 + puskesmasUsers.length + laporanCount}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('🔑 Login Credentials:');
    console.log('   Admin:');
    console.log('   - Username: dinkes');
    console.log('   - Password: dinkes\n');
    console.log('   Puskesmas (sample):');
    console.log('   - Username: bojonggede');
    console.log('   - Password: bogorkab\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

seed2025();
