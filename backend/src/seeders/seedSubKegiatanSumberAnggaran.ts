/**
 * Seed Script: Populate sub_kegiatan_sumber_dana junction table
 * Purpose: Assign default sumber anggaran to all existing sub kegiatan
 * 
 * Run: npx tsx src/seeders/seedSubKegiatanSumberAnggaran.ts
 */

import { sequelize } from '../config/database';
import SubKegiatan from '../models/SubKegiatan';
import SumberAnggaran from '../models/SumberAnggaran';
import SubKegiatanSumberAnggaran from '../models/SubKegiatanSumberAnggaran';

async function seedSubKegiatanSumberAnggaran() {
  try {
    console.log('🌱 Starting sub_kegiatan_sumber_dana seeding...');

    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Get all sub kegiatan and sumber anggaran
    const subKegiatanList = await SubKegiatan.findAll();
    const sumberAnggaranList = await SumberAnggaran.findAll();

    console.log(`📊 Found ${subKegiatanList.length} sub kegiatan`);
    console.log(`📊 Found ${sumberAnggaranList.length} sumber anggaran`);

    if (subKegiatanList.length === 0 || sumberAnggaranList.length === 0) {
      console.log('⚠️  No data to seed. Please seed master data first.');
      return;
    }

    // Strategy: Assign all sumber anggaran to all sub kegiatan initially
    // Admin can later customize which sumber anggaran are valid for each sub kegiatan
    
    let count = 0;
    const assignments: Array<{ id_sub_kegiatan: number; id_sumber_anggaran: number }> = [];

    for (const subKegiatan of subKegiatanList) {
      for (const sumberAnggaran of sumberAnggaranList) {
        assignments.push({
          id_sub_kegiatan: subKegiatan.id_sub_kegiatan,
          id_sumber_anggaran: sumberAnggaran.id_sumber,
        });
      }
    }

    // Bulk create with ignore duplicates
    for (const assignment of assignments) {
      try {
        await SubKegiatanSumberAnggaran.findOrCreate({
          where: {
            id_sub_kegiatan: assignment.id_sub_kegiatan,
            id_sumber_anggaran: assignment.id_sumber_anggaran,
          },
          defaults: {
            ...assignment,
            is_active: true,
          },
        });
        count++;
      } catch (error: any) {
        if (!error.message.includes('unique')) {
          console.error(`Error creating assignment:`, error.message);
        }
      }
    }

    console.log(`✅ Created ${count} sub_kegiatan-sumber_anggaran assignments`);
    console.log('');
    console.log('📝 Note: All sumber anggaran are now assigned to all sub kegiatan.');
    console.log('   Admin can customize this via Admin Panel > Kegiatan > sumber anggaran button');
    console.log('');
    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedSubKegiatanSumberAnggaran()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedSubKegiatanSumberAnggaran;
