/**
 * Check database indexes for anggaran_kas table
 */

import sequelize from '../src/config/database';

async function checkIndexes() {
  try {
    const [results] = await sequelize.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'anggaran_kas'
    `);
    
    console.log('Indexes on anggaran_kas table:');
    (results as any[]).forEach(r => {
      const isUnique = r.indexdef.includes('UNIQUE');
      console.log(`  ${r.indexname}: ${isUnique ? '⚠️ UNIQUE' : '✅ NOT UNIQUE'}`);
      if (isUnique) {
        console.log(`    ${r.indexdef}`);
      }
    });

    // Also check constraints
    const [constraints] = await sequelize.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'anggaran_kas'::regclass
    `);
    
    console.log('\nConstraints on anggaran_kas table:');
    (constraints as any[]).forEach(c => {
      console.log(`  ${c.conname}: type=${c.contype}`);
      console.log(`    ${c.definition}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkIndexes();
