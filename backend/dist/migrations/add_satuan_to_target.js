"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const sequelize_1 = require("sequelize");
const up = async (queryInterface) => {
    await queryInterface.addColumn('sub_kegiatan_target', 'id_satuan', {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'satuan',
            key: 'id_satuan',
        },
        onDelete: 'SET NULL',
    });
};
exports.up = up;
const down = async (queryInterface) => {
    await queryInterface.removeColumn('sub_kegiatan_target', 'id_satuan');
};
exports.down = down;
//# sourceMappingURL=add_satuan_to_target.js.map