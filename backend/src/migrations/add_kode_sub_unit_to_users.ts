import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Add kode_sub_unit column to users table
  await queryInterface.addColumn('users', 'kode_sub_unit', {
    type: DataTypes.STRING(50),
    allowNull: true,
  });

  // Create index for faster lookups
  await queryInterface.addIndex('users', ['kode_sub_unit'], {
    name: 'idx_users_kode_sub_unit',
  });

  console.log('✅ Added kode_sub_unit column to users table');
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeIndex('users', 'idx_users_kode_sub_unit');
  await queryInterface.removeColumn('users', 'kode_sub_unit');
  console.log('✅ Removed kode_sub_unit column from users table');
}
