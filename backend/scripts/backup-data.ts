/**
 * Database Backup Script for E-EVKIN Modern
 * 
 * This script exports all data from the database to JSON files
 * that can be restored on a fresh database.
 * 
 * Usage:
 *   npx tsx scripts/backup-data.ts
 *   npx tsx scripts/backup-data.ts --output ./my-backup
 * 
 * Output:
 *   Creates a timestamped backup folder with JSON files for each table.
 */

import { sequelize } from '../src/config/database';
import {
  User,
  Kegiatan,
  SubKegiatan,
  SumberAnggaran,
  Satuan,
  Laporan,
  SubKegiatanTarget,
  SubKegiatanSumberAnggaran,
  PuskesmasSubKegiatan,
  AnggaranKas,
  PuskesmasEditPermission,
} from '../src/models';
import * as fs from 'fs';
import * as path from 'path';

async function backupData() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  // Parse command line args
  const args = process.argv.slice(2);
  const outputIdx = args.indexOf('--output');
  const baseDir = outputIdx !== -1 && args[outputIdx + 1] 
    ? args[outputIdx + 1] 
    : path.join(__dirname, '..', 'backups', `backup-${timestamp}`);

  console.log('='.repeat(60));
  console.log('E-EVKIN Modern Database Backup');
  console.log('='.repeat(60));
  console.log(`Output directory: ${baseDir}`);
  console.log('');

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Create backup directory
    fs.mkdirSync(baseDir, { recursive: true });
    console.log(`✓ Created backup directory: ${baseDir}`);
    console.log('');

    // Define tables to backup in order (respecting dependencies)
    const tables = [
      { name: 'users', model: User, pk: 'id' },
      { name: 'kegiatan', model: Kegiatan, pk: 'id_kegiatan' },
      { name: 'sub_kegiatan', model: SubKegiatan, pk: 'id_sub_kegiatan' },
      { name: 'sumber_anggaran', model: SumberAnggaran, pk: 'id_sumber' },
      { name: 'satuan', model: Satuan, pk: 'id_satuan' },
      { name: 'laporan', model: Laporan, pk: 'id' },
      { name: 'sub_kegiatan_target', model: SubKegiatanTarget, pk: 'id' },
      { name: 'sub_kegiatan_sumber_dana', model: SubKegiatanSumberAnggaran, pk: 'id' },
      { name: 'puskesmas_sub_kegiatan', model: PuskesmasSubKegiatan, pk: 'id' },
      { name: 'anggaran_kas', model: AnggaranKas, pk: 'id' },
      { name: 'puskesmas_edit_permission', model: PuskesmasEditPermission, pk: 'id' },
    ];

    const summary: { table: string; count: number; file: string }[] = [];

    // Backup each table
    for (const { name, model, pk } of tables) {
      console.log(`Backing up ${name}...`);
      
      try {
        const records = await model.findAll({
          raw: true,
          order: [[pk, 'ASC']],
        });

        const filePath = path.join(baseDir, `${name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(records, null, 2));
        
        summary.push({ table: name, count: records.length, file: `${name}.json` });
        console.log(`  ✓ ${records.length} records exported to ${name}.json`);
      } catch (err: any) {
        console.log(`  ✗ Error: ${err.message}`);
        summary.push({ table: name, count: -1, file: 'ERROR' });
      }
    }

    // Create metadata file
    const metadata = {
      backupDate: new Date().toISOString(),
      database: process.env.DATABASE_URL?.split('@')[1]?.split('/')[1] || 'unknown',
      tables: summary,
      totalRecords: summary.reduce((sum, t) => sum + (t.count > 0 ? t.count : 0), 0),
    };
    fs.writeFileSync(
      path.join(baseDir, '_metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    // Print summary
    console.log('');
    console.log('='.repeat(60));
    console.log('Backup Summary');
    console.log('='.repeat(60));
    console.log('');
    console.log('Table'.padEnd(35) + 'Records'.padStart(10));
    console.log('-'.repeat(45));
    for (const { table, count } of summary) {
      console.log(table.padEnd(35) + (count >= 0 ? count.toString() : 'ERROR').padStart(10));
    }
    console.log('-'.repeat(45));
    console.log('Total'.padEnd(35) + metadata.totalRecords.toString().padStart(10));
    console.log('');
    console.log(`✓ Backup completed successfully!`);
    console.log(`  Location: ${baseDir}`);
    console.log('');

    process.exit(0);
  } catch (error: any) {
    console.error('');
    console.error('✗ Backup failed:', error.message);
    process.exit(1);
  }
}

backupData();
