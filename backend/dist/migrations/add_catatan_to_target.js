"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = {
    up: async (queryInterface) => {
        // Add catatan column for change notes/history
        await queryInterface.addColumn('sub_kegiatan_target', 'catatan', {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'Catatan perubahan - mencatat sumber/alasan perubahan data',
        });
        console.log('✅ Added catatan column to sub_kegiatan_target table');
        // Fix any null timestamps
        await queryInterface.sequelize.query(`
      UPDATE sub_kegiatan_target 
      SET created_at = NOW() 
      WHERE created_at IS NULL
    `);
        await queryInterface.sequelize.query(`
      UPDATE sub_kegiatan_target 
      SET updated_at = NOW() 
      WHERE updated_at IS NULL
    `);
        console.log('✅ Fixed null timestamps in sub_kegiatan_target table');
    },
    down: async (queryInterface) => {
        await queryInterface.removeColumn('sub_kegiatan_target', 'catatan');
    },
};
//# sourceMappingURL=add_catatan_to_target.js.map