import { SubKegiatanTarget, AnggaranKas, User, SubKegiatan } from '../models';
import sequelize from '../config/database';
import { Op } from 'sequelize';

async function main() {
    try {
        await sequelize.authenticate();
        console.log('DB Connection OK');

        const users = await User.findAll({
            where: { nama_puskesmas: { [Op.iLike]: '%bojonggede%' } },
            logging: false
        });

        if (users.length === 0) {
            console.log('No user found for Bojonggede');
            return;
        }
        const user = users[0];
        console.log('User ID:', user.id);

        // 1. Replica of getLatestTargets used in admin.routes.ts
        // The route uses: const targetFilter = { tahun: yearParsed, bulan: null, user_id: userId };
        // REMOVING bulan: null to check what the actual bulan is
        const targetFilter = {
            tahun: 2026,
            user_id: user.id
        };

        console.log('Testing Target Query WITHOUT bulan filter:', JSON.stringify(targetFilter));

        try {
            const allTargets = await SubKegiatanTarget.findAll({
                where: targetFilter,
                include: [{
                    model: SubKegiatan,
                    as: 'subKegiatan',
                    attributes: ['id_sub_kegiatan', 'kegiatan']
                }],
                order: [['created_at', 'DESC']],
                raw: true,
                nest: true,
                logging: false
            });

            console.log(`Targets Result Count: ${allTargets.length}`);
            if (allTargets.length > 0) {
                allTargets.forEach((t: any, i: number) => {
                    if (i < 5) console.log(`Target ${i}: bulan=${t.bulan} (Type: ${typeof t.bulan}) target=${t.target_rp}`);
                });
            }
        } catch (e: any) {
            console.error('Target Query Error:', e.message);
        }

        // 2. Replica of getLatestAngkas used in admin.routes.ts
        // The route uses: const angkasFilter = { tahun: yearParsed, user_id: userId };
        const angkasFilter = {
            tahun: 2026,
            user_id: user.id
        };

        console.log('Testing Angkas Query with filter:', JSON.stringify(angkasFilter));

        try {
            const allAngkas = await AnggaranKas.findAll({
                where: angkasFilter,
                order: [['created_at', 'DESC']],
                raw: true,
                logging: false
            });

            console.log(`Angkas Result Count: ${allAngkas.length}`);
            if (allAngkas.length > 0) console.log('Sample Angkas:', allAngkas[0]);
        } catch (e: any) {
            console.error('Angkas Query Error:', e.message);
        }

        // Simulate Processing
        console.log('--- Simulating Processing ---');
        const viewMode = 'yearly';

        // FETCH DATA AGAIN TO USE IN PROCESSING
        const latestTargets = await SubKegiatanTarget.findAll({
            where: targetFilter,
            include: [{ model: SubKegiatan, as: 'subKegiatan', attributes: ['id_sub_kegiatan', 'kegiatan'] }],
            raw: true, nest: true, logging: false
        });

        const latestAngkas = await AnggaranKas.findAll({
            where: angkasFilter,
            raw: true, logging: false
        });

        // Simulate Laporan Data (Empty for now as issue is Anggaran/Angkas)
        const laporanData: any[] = [];

        let processedData: any[] = []; // Explicitly type as array

        if (viewMode === 'yearly') {
            const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

            const totalAnggaran = latestTargets.reduce((sum: number, t: any) => sum + (Number(t.target_rp) || 0), 0);
            console.log('Total Anggaran:', totalAnggaran);

            processedData = months.map((monthName, index) => {
                const monthNum = index + 1;

                const angkasForMonth = latestAngkas
                    .filter((a: any) => a.bulan === monthNum)
                    .reduce((sum: number, a: any) => sum + (Number(a.nilai) || 0), 0);

                return {
                    label: monthName,
                    anggaran: totalAnggaran,
                    angkas: angkasForMonth,
                    realisasi_anggaran: 0
                };
            });
        }

        console.log('Processed Data Length:', processedData.length);
        if (processedData.length > 0) console.log('Sample Data:', processedData[0]);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

main();
