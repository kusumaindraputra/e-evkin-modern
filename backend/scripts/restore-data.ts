/**
 * Database Restore Script for E-EVKIN Modern
 * 
 * This script restores data from JSON backup files to the database.
 * Run migrations first to create the schema, then run this script.
 * 
 * Usage:
 *   npx tsx scripts/restore-data.ts ./backups/backup-2026-01-11
 *   npx tsx scripts/restore-data.ts ./backups/backup-2026-01-11 --force
 * 
 * Options:
 *   --force   Skip confirmation prompt and truncate existing data
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
import * as readline from 'readline';

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function restoreData() {
  const args = process.argv.slice(2);
  const backupDir = args.find(arg => !arg.startsWith('--'));
  const force = args.includes('--force');

  if (!backupDir) {
    console.error('Usage: npx tsx scripts/restore-data.ts <backup-directory> [--force]');
    console.error('');
    console.error('Example:');
    console.error('  npx tsx scripts/restore-data.ts ./backups/backup-2026-01-11');
    process.exit(1);
  }

  if (!fs.existsSync(backupDir)) {
    console.error(`Error: Backup directory not found: ${backupDir}`);
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('E-EVKIN Modern Database Restore');
  console.log('='.repeat(60));
  console.log(`Backup directory: ${backupDir}`);
  console.log('');

  // Read metadata
  const metadataPath = path.join(backupDir, '_metadata.json');
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    console.log(`Backup date: ${metadata.backupDate}`);
    console.log(`Total records: ${metadata.totalRecords}`);
    console.log('');
  }

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Confirmation
    if (!force) {
      console.log('');
      console.log('⚠️  WARNING: This will DELETE all existing data and restore from backup!');
      const answer = await prompt('Are you sure you want to continue? (yes/no): ');
      if (answer.toLowerCase() !== 'yes') {
        console.log('Restore cancelled.');
        process.exit(0);
      }
    }

    console.log('');

    // Define tables in order (respecting foreign key dependencies)
    // Must restore in correct order: parents first, then children
    const tables = [
      { name: 'users', model: User, pk: 'id' },
      { name: 'kegiatan', model: Kegiatan, pk: 'id_kegiatan' },
      { name: 'sumber_anggaran', model: SumberAnggaran, pk: 'id_sumber' },
      { name: 'satuan', model: Satuan, pk: 'id_satuan' },
      { name: 'sub_kegiatan', model: SubKegiatan, pk: 'id_sub_kegiatan' },
      { name: 'sub_kegiatan_sumber_dana', model: SubKegiatanSumberAnggaran, pk: 'id' },
      { name: 'puskesmas_sub_kegiatan', model: PuskesmasSubKegiatan, pk: 'id' },
      { name: 'sub_kegiatan_target', model: SubKegiatanTarget, pk: 'id' },
      { name: 'anggaran_kas', model: AnggaranKas, pk: 'id' },
      { name: 'laporan', model: Laporan, pk: 'id' },
      { name: 'puskesmas_edit_permission', model: PuskesmasEditPermission, pk: 'id' },
    ];

    const summary: { table: string; count: number; status: string }[] = [];

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Disable foreign key checks temporarily
      await sequelize.query('SET session_replication_role = replica;', { transaction });

      // Truncate and restore each table
      for (const { name, model, pk } of tables) {
        const filePath = path.join(backupDir, `${name}.json`);
        
        if (!fs.existsSync(filePath)) {
          console.log(`⚠ Skipping ${name} (no backup file found)`);
          summary.push({ table: name, count: 0, status: 'SKIPPED' });
          continue;
        }

        console.log(`Restoring ${name}...`);

        try {
          // Read backup data
          const records = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          
          // Truncate table
          await model.destroy({ where: {}, truncate: true, cascade: true, transaction });
          
          // Insert records in batches
          if (records.length > 0) {
            const batchSize = 100;
            for (let i = 0; i < records.length; i += batchSize) {
              const batch = records.slice(i, i + batchSize);
              await model.bulkCreate(batch, { 
                transaction,
                ignoreDuplicates: false,
                validate: false, // Skip validation for speed
              });
            }
          }

          // Reset sequence for auto-increment columns
          if (pk !== 'id' || name !== 'users') {
            const maxResult = await model.max(pk, { transaction });
            if (maxResult && typeof maxResult === 'number') {
              const seqName = `${name}_${pk}_seq`;
              await sequelize.query(
                `SELECT setval('${seqName}', ${maxResult}, true);`,
                { transaction }
              ).catch(() => {
                // Sequence might not exist or have different name
              });
            }
          }

          summary.push({ table: name, count: records.length, status: 'OK' });
          console.log(`  ✓ ${records.length} records restored`);
        } catch (err: any) {
          console.log(`  ✗ Error: ${err.message}`);
          summary.push({ table: name, count: -1, status: 'ERROR' });
          throw err; // Rollback on error
        }
      }

      // Re-enable foreign key checks
      await sequelize.query('SET session_replication_role = DEFAULT;', { transaction });

      // Commit transaction
      await transaction.commit();

      // Print summary
      console.log('');
      console.log('='.repeat(60));
      console.log('Restore Summary');
      console.log('='.repeat(60));
      console.log('');
      console.log('Table'.padEnd(35) + 'Records'.padStart(10) + '  Status');
      console.log('-'.repeat(55));
      for (const { table, count, status } of summary) {
        console.log(
          table.padEnd(35) + 
          (count >= 0 ? count.toString() : '-').padStart(10) + 
          '  ' + status
        );
      }
      console.log('-'.repeat(55));
      const totalRestored = summary.reduce((sum, t) => sum + (t.count > 0 ? t.count : 0), 0);
      console.log('Total'.padEnd(35) + totalRestored.toString().padStart(10));
      console.log('');
      console.log(`✓ Restore completed successfully!`);
      console.log('');

    } catch (error) {
      // Rollback on error
      await transaction.rollback();
      throw error;
    }

    process.exit(0);
  } catch (error: any) {
    console.error('');
    console.error('✗ Restore failed:', error.message);
    process.exit(1);
  }
}

restoreData();
