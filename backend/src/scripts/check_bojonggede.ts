import { SubKegiatanTarget, AnggaranKas, User } from '../models';
import sequelize from '../config/database';

const runDebug = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        const searchName = 'Bojonggede';
        const year = 2026;

        // 1. Find User
        const user = await User.findOne({
            where: sequelize.where(
                sequelize.fn('lower', sequelize.col('nama_puskesmas')),
                { [sequelize.Op.like]: `%${searchName.toLowerCase()}%` }
            )
        });

        if (!user) {
            console.log(`User '${searchName}' not found.`);
            return;
        }
        console.log(`User Found: ${user.nama_puskesmas} (ID: ${user.id})`);

        // 2. Check Angkas (Monthly)
        const angkasCount = await AnggaranKas.count({
            where: { user_id: user.id, tahun: year }
        });
        console.log(`Angkas Records for 2026: ${angkasCount}`);

        if (angkasCount > 0) {
            const sampleAngkas = await AnggaranKas.findOne({
                where: { user_id: user.id, tahun: year }
            });
            console.log('Sample Angkas:', sampleAngkas?.toJSON());
        }

        // 3. Check Target (Yearly)
        const targetCount = await SubKegiatanTarget.count({
            where: { user_id: user.id, tahun: year }
        });
        console.log(`Target Records for 2026: ${targetCount}`);

    } catch (error) {
        console.error('Debug Error:', error);
    } finally {
        await sequelize.close();
    }
};

runDebug();
