"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
async function clearData() {
    try {
        console.log('=== Clearing existing data ===');
        const targetCount = await models_1.SubKegiatanTarget.count();
        const angkasCount = await models_1.AnggaranKas.count();
        const laporanCount = await models_1.Laporan.count();
        console.log('Before clear:');
        console.log('- SubKegiatanTarget:', targetCount);
        console.log('- AnggaranKas:', angkasCount);
        console.log('- Laporan:', laporanCount);
        // Clear data
        await models_1.SubKegiatanTarget.destroy({ where: {}, force: true });
        await models_1.AnggaranKas.destroy({ where: {}, force: true });
        await models_1.Laporan.destroy({ where: {}, force: true });
        console.log('\nAfter clear:');
        console.log('- SubKegiatanTarget:', await models_1.SubKegiatanTarget.count());
        console.log('- AnggaranKas:', await models_1.AnggaranKas.count());
        console.log('- Laporan:', await models_1.Laporan.count());
        console.log('\n=== Data cleared successfully ===');
        await models_1.sequelize.close();
        process.exit(0);
    }
    catch (error) {
        console.error('Error clearing data:', error);
        await models_1.sequelize.close();
        process.exit(1);
    }
}
clearData();
//# sourceMappingURL=clearData.js.map