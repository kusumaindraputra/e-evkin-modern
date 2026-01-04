"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
async function check() {
    try {
        // Check database state
        console.log('SubKegiatanTarget:', await models_1.SubKegiatanTarget.count());
        console.log('AnggaranKas:', await models_1.AnggaranKas.count());
        // Check users with kode_sub_unit
        const users = await models_1.User.findAll({
            where: { role: 'puskesmas' },
            attributes: ['id', 'nama', 'kode_sub_unit'],
            order: [['kode_sub_unit', 'ASC']]
        });
        console.log('\nPuskesmas users with kode_sub_unit:');
        users.slice(0, 15).forEach(u => console.log('  [%s] %s', u.kode_sub_unit, u.nama));
        console.log('  ... and %d more', users.length - 15);
        // Check if any users without kode_sub_unit
        const noKode = users.filter(u => !u.kode_sub_unit);
        console.log('\nUsers without kode_sub_unit:', noKode.length);
        process.exit(0);
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
}
check();
//# sourceMappingURL=checkData.js.map