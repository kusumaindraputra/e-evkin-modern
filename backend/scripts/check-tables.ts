import { sequelize } from '../src/config/database';
import '../src/models';
import { QueryTypes } from 'sequelize';

async function checkTables() {
  const results = await sequelize.query<{ table_name: string }>(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name",
    { type: QueryTypes.SELECT }
  );
  console.log('Tables in database:');
  results.forEach((r) => console.log('  -', r.table_name));
  console.log('\nTotal tables:', results.length);
  await sequelize.close();
}

checkTables().catch(console.error);
