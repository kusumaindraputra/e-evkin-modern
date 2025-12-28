"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const sequelize_1 = require("sequelize");
const up = async (queryInterface) => {
    await queryInterface.changeColumn('puskesmas_edit_permission', 'user_id', {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    });
};
exports.up = up;
const down = async (queryInterface) => {
    await queryInterface.changeColumn('puskesmas_edit_permission', 'user_id', {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    });
};
exports.down = down;
//# sourceMappingURL=alter_puskesmas_edit_permission_allow_null_user.js.map