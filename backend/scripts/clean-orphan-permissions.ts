import sequelize from '../src/config/database';

async function cleanOrphanPermissions() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Find orphan records in puskesmas_edit_permission with invalid created_by
    const [orphanPerms] = await sequelize.query(`
      SELECT pep.id, pep.user_id, pep.created_by
      FROM puskesmas_edit_permission pep
      WHERE pep.created_by IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = pep.created_by)
    `);

    console.log(`Found ${(orphanPerms as any[]).length} orphan records in puskesmas_edit_permission with invalid created_by`);

    if ((orphanPerms as any[]).length > 0) {
      // Delete records with invalid created_by
      await sequelize.query(`
        DELETE FROM puskesmas_edit_permission
        WHERE created_by IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = puskesmas_edit_permission.created_by)
      `);
      console.log(`✓ Deleted ${(orphanPerms as any[]).length} orphan records with invalid created_by`);
    }

    // Also check for orphan user_id references
    const [orphanUserIds] = await sequelize.query(`
      SELECT pep.id, pep.user_id
      FROM puskesmas_edit_permission pep
      WHERE pep.user_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = pep.user_id)
    `);

    console.log(`Found ${(orphanUserIds as any[]).length} orphan records with invalid user_id`);

    if ((orphanUserIds as any[]).length > 0) {
      // Delete records with invalid user_id since they're useless
      await sequelize.query(`
        DELETE FROM puskesmas_edit_permission
        WHERE user_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = puskesmas_edit_permission.user_id)
      `);
      console.log(`✓ Deleted orphan records with invalid user_id`);
    }

    console.log('\n✓ Cleanup complete!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

cleanOrphanPermissions();
