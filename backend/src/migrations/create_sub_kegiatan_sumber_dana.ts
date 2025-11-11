/**
 * Migration: Create sub_kegiatan_sumber_dana junction table
 * Purpose: Enable many-to-many relationship between SubKegiatan and SumberAnggaran
 * 
 * Run: npx tsx src/migrations/create_sub_kegiatan_sumber_dana.ts
 */

import { QueryInterface, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

async function up(queryInterface: QueryInterface): Promise<void> {
  console.log('🔄 Creating sub_kegiatan_sumber_dana table...');
  
  await queryInterface.createTable('sub_kegiatan_sumber_dana', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_sub_kegiatan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sub_kegiatan',
        key: 'id_sub_kegiatan',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    id_sumber_anggaran: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sumber_anggaran',
        key: 'id_sumber',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Add unique constraint
  await queryInterface.addConstraint('sub_kegiatan_sumber_dana', {
    fields: ['id_sub_kegiatan', 'id_sumber_anggaran'],
    type: 'unique',
    name: 'unique_sub_kegiatan_sumber',
  });

  // Add indexes
  await queryInterface.addIndex('sub_kegiatan_sumber_dana', ['id_sub_kegiatan']);
  await queryInterface.addIndex('sub_kegiatan_sumber_dana', ['id_sumber_anggaran']);

  console.log('✅ Table sub_kegiatan_sumber_dana created successfully');

  // Migrate existing data from laporan table
  console.log('🔄 Migrating existing laporan data to junction table...');
  
  await queryInterface.sequelize.query(`
    INSERT INTO sub_kegiatan_sumber_dana (id_sub_kegiatan, id_sumber_anggaran, is_active, "createdAt", "updatedAt")
    SELECT DISTINCT 
      id_sub_kegiatan, 
      id_sumber_anggaran, 
      true,
      NOW(),
      NOW()
    FROM laporan
    ON CONFLICT ON CONSTRAINT unique_sub_kegiatan_sumber DO NOTHING;
  `);

  const [results] = await queryInterface.sequelize.query(`
    SELECT COUNT(*) as count FROM sub_kegiatan_sumber_dana;
  `);
  
  console.log(`✅ Migrated ${(results as any)[0].count} sub_kegiatan-sumber_anggaran pairs`);
}

async function down(queryInterface: QueryInterface): Promise<void> {
  console.log('🔄 Dropping sub_kegiatan_sumber_dana table...');
  
  await queryInterface.dropTable('sub_kegiatan_sumber_dana');
  
  console.log('✅ Table dropped successfully');
}

// Run migration if executed directly
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected');

      const queryInterface = sequelize.getQueryInterface();
      await up(queryInterface);

      console.log('✅ Migration completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  })();
}

export { up, down };
