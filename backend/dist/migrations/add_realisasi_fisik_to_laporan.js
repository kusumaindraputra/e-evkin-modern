"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up(queryInterface) {
    await queryInterface.addColumn('laporan', 'realisasi_fisik', {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100,
        },
    });
}
async function down(queryInterface) {
    await queryInterface.removeColumn('laporan', 'realisasi_fisik');
}
//# sourceMappingURL=add_realisasi_fisik_to_laporan.js.map