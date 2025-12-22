const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'evkin_db',
  user: 'postgres',
  password: 'admin',
});

async function addSatuanColumn() {
  try {
    await client.connect();
    console.log('Connected to database');

    await client.query(`
      ALTER TABLE sub_kegiatan_target 
      ADD COLUMN IF NOT EXISTS id_satuan INTEGER REFERENCES satuan(id_satuan) ON DELETE SET NULL;
    `);

    console.log('✅ Column id_satuan added successfully to sub_kegiatan_target table');

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addSatuanColumn();
