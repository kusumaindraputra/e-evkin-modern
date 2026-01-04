"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up(queryInterface) {
    // Add kode_sub_unit column to users table
    await queryInterface.addColumn('users', 'kode_sub_unit', {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    });
    // Create index for faster lookups
    await queryInterface.addIndex('users', ['kode_sub_unit'], {
        name: 'idx_users_kode_sub_unit',
    });
    console.log('✅ Added kode_sub_unit column to users table');
}
async function down(queryInterface) {
    await queryInterface.removeIndex('users', 'idx_users_kode_sub_unit');
    await queryInterface.removeColumn('users', 'kode_sub_unit');
    console.log('✅ Removed kode_sub_unit column from users table');
}
//# sourceMappingURL=add_kode_sub_unit_to_users.js.map