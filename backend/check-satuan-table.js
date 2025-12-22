const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'evkin_db',
  user: 'postgres',
  password: 'admin',
});

async function checkSatuanTable() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Get table structure
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'satuan'
      ORDER BY ordinal_position;
    `);

    console.log('Satuan table structure:');
    console.table(result.rows);

    // Get sample data
    const data = await client.query('SELECT * FROM satuan LIMIT 5;');
    console.log('\nSample data:');
    console.table(data.rows);

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSatuanTable();
