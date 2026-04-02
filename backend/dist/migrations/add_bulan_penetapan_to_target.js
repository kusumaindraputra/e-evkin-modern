"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = {
    up: async (queryInterface) => {
        await queryInterface.addColumn('sub_kegiatan_target', 'bulan_penetapan', {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
            comment: 'Bulan penetapan (1-12), null = berlaku dari awal tahun',
        });
        console.log('✅ Added bulan_penetapan column to sub_kegiatan_target table');
        await queryInterface.addColumn('sub_kegiatan_target', 'tanggal_penetapan', {
            type: sequelize_1.DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Tanggal resmi penetapan anggaran',
        });
        console.log('✅ Added tanggal_penetapan column to sub_kegiatan_target table');
    },
    down: async (queryInterface) => {
        await queryInterface.removeColumn('sub_kegiatan_target', 'bulan_penetapan');
        await queryInterface.removeColumn('sub_kegiatan_target', 'tanggal_penetapan');
    },
};
//# sourceMappingURL=add_bulan_penetapan_to_target.js.map