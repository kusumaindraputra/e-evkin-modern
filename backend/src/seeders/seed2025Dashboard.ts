/**
 * Seed Data untuk Dashboard Testing - Tahun 2025 Lengkap (Januari - Desember)
 * 
 * PENTING: 
 * - realisasi_rp dan realisasi_k di Laporan adalah nilai BULANAN (delta), bukan kumulatif
 * - Dashboard endpoint akan mengakumulasikan sendiri
 * - realisasi_fisik adalah YTD percentage (%)
 * 
 * Run: cd backend && npx tsx src/seeders/seed2025Dashboard.ts
 * Cleanup: cd backend && npx tsx src/seeders/seed2025Dashboard.ts cleanup
 */

import { sequelize, SubKegiatanTarget, Laporan, User, AnggaranKas } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

// Constants
const TAHUN = 2025;
const BULAN_LIST = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Budget change months (0-indexed): March(2), July(6), October(9)
const BUDGET_CHANGE_MONTHS = [
    { month: 2, date: '2025-03-15', factor: 1.15 },  // March: +15%
    { month: 6, date: '2025-07-10', factor: 0.92 },  // July: -8%
    { month: 9, date: '2025-10-05', factor: 1.08 },  // October: +8%
];

// Sub Kegiatan IDs
const SUB_KEGIATAN_IDS = [1, 2, 3, 4, 5, 6, 7];
const SUMBER_ANGGARAN_IDS = [1, 2, 3, 4];
const SATUAN_IDS = [1, 2, 3, 4, 5];

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
}

// Generate initial targets + budget change records
async function generateTargetData(puskesmasUsers: any[]) {
    const targets: any[] = [];

    for (const user of puskesmasUsers) {
        const numSubKeg = randomBetween(3, 5);
        const selectedSubKeg = [...SUB_KEGIATAN_IDS].sort(() => Math.random() - 0.5).slice(0, numSubKeg);

        for (const idSubKeg of selectedSubKeg) {
            const numSumber = randomBetween(1, 2);
            const selectedSumber = [...SUMBER_ANGGARAN_IDS].sort(() => Math.random() - 0.5).slice(0, numSumber);

            for (const idSumber of selectedSumber) {
                const sizeFactor = randomBetween(50, 150) / 100;
                const baseTargetRp = randomBetween(50_000_000, 500_000_000);
                let targetRp = Math.round(baseTargetRp * sizeFactor);
                const targetK = randomBetween(100, 1000);

                // Initial target (January 1st)
                targets.push({
                    user_id: user.id,
                    id_sub_kegiatan: idSubKeg,
                    id_sumber_anggaran: idSumber,
                    id_satuan: randomFrom(SATUAN_IDS),
                    target_k: targetK,
                    target_rp: targetRp,
                    tahun: TAHUN,
                    bulan: null,
                    catatan: `Initial budget 2025 - ${user.nama_puskesmas}`,
                    created_by: user.id,
                    created_at: new Date('2025-01-01T08:00:00'),
                    updated_at: new Date('2025-01-01T08:00:00'),
                });

                // Budget changes at March, July, October
                let currentBudget = targetRp;
                for (const change of BUDGET_CHANGE_MONTHS) {
                    currentBudget = Math.round(currentBudget * change.factor);
                    targets.push({
                        user_id: user.id,
                        id_sub_kegiatan: idSubKeg,
                        id_sumber_anggaran: idSumber,
                        id_satuan: randomFrom(SATUAN_IDS),
                        target_k: Math.round(targetK * change.factor),
                        target_rp: currentBudget,
                        tahun: TAHUN,
                        bulan: null,
                        catatan: `Budget revision ${BULAN_LIST[change.month]} - ${user.nama_puskesmas}`,
                        created_by: user.id,
                        created_at: new Date(change.date + 'T10:00:00'),
                        updated_at: new Date(change.date + 'T10:00:00'),
                    });
                }
            }
        }
    }

    return targets;
}

// Generate AnggaranKas (monthly allocation)
function generateAngkasData(targets: any[]) {
    const angkasData: any[] = [];
    // Only use initial targets (not budget revisions) for angkas generation
    const initialTargets = targets.filter(t => t.catatan.startsWith('Initial'));

    for (const target of initialTargets) {
        const patterns = [
            [6, 6, 8, 8, 8, 10, 10, 10, 10, 8, 8, 8],
            [4, 4, 6, 8, 10, 12, 12, 12, 10, 10, 8, 4],
            [10, 10, 10, 8, 8, 6, 6, 8, 10, 10, 8, 6],
            [5, 5, 7, 7, 8, 8, 10, 10, 12, 12, 8, 8],
        ];
        const pattern = randomFrom(patterns);
        const total = pattern.reduce((a, b) => a + b, 0);

        for (let bulan = 1; bulan <= 12; bulan++) {
            const monthlyNilai = Math.round((target.target_rp * pattern[bulan - 1]) / total);
            const kodeRekening = `1.02.02.2.02.00${String(target.id_sub_kegiatan).padStart(2, '0')}`;

            angkasData.push({
                user_id: target.user_id,
                id_sub_kegiatan: target.id_sub_kegiatan,
                id_sumber_anggaran: target.id_sumber_anggaran,
                kode_rekening: kodeRekening,
                uraian: `Sub Kegiatan ${target.id_sub_kegiatan} - Sumber ${target.id_sumber_anggaran}`,
                tahun: TAHUN,
                bulan: bulan,
                nilai: monthlyNilai,
                created_by: target.created_by,
                created_at: new Date('2025-01-01T08:00:00'),
                updated_at: new Date('2025-01-01T08:00:00'),
            });
        }
    }

    return angkasData;
}

// Generate Laporan data with MONTHLY values
function generateLaporanData(targets: any[], angkasData: any[]) {
    const laporans: any[] = [];

    // Only use initial targets for laporan generation
    const initialTargets = targets.filter(t => t.catatan.startsWith('Initial'));

    const permasalahanList = [
        'Keterbatasan anggaran operasional',
        'Cuaca tidak mendukung kegiatan lapangan',
        'Kurangnya partisipasi masyarakat',
        'Keterbatasan SDM',
        'Kendala koordinasi lintas sektor',
        '',
    ];

    const upayaList = [
        'Melakukan efisiensi anggaran',
        'Penjadwalan ulang kegiatan',
        'Peningkatan sosialisasi ke masyarakat',
        'Koordinasi dengan BPJS',
        '',
    ];

    for (const target of initialTargets) {
        // Track cumulative values for internal calculation
        let cumulativeRealisasiRp = 0;
        let cumulativeRealisasiK = 0;

        for (let bulanIndex = 0; bulanIndex < 12; bulanIndex++) {
            const bulan = BULAN_LIST[bulanIndex];
            const bulanNum = bulanIndex + 1;

            // Skip some late months randomly (completion rate)
            if (Math.random() > 0.85 && bulanIndex > 8) continue;

            // Get monthly angkas for this target
            const monthlyAngkas = angkasData.filter(
                a => a.user_id === target.user_id &&
                    a.id_sub_kegiatan === target.id_sub_kegiatan &&
                    a.id_sumber_anggaran === target.id_sumber_anggaran &&
                    a.bulan === bulanNum
            );
            const angkasValue = monthlyAngkas.reduce((sum, a) => sum + Number(a.nilai), 0);

            // Get cumulative angkas up to this month
            const cumulativeAngkas = angkasData
                .filter(
                    a => a.user_id === target.user_id &&
                        a.id_sub_kegiatan === target.id_sub_kegiatan &&
                        a.id_sumber_anggaran === target.id_sumber_anggaran &&
                        a.bulan <= bulanNum
                )
                .reduce((sum, a) => sum + Number(a.nilai), 0);

            // =================================================================
            // KEY FIX: Calculate MONTHLY values ensuring hierarchy
            // Rule: cumulativeAngkas >= physicalValue >= cumulativeFinancial
            // =================================================================

            // 1. Monthly Financial (delta) - 75-90% of monthly angkas
            const financialPerformance = randomBetween(75, 90) / 100;
            const monthlyRealisasiRp = Math.floor(angkasValue * financialPerformance);
            cumulativeRealisasiRp += monthlyRealisasiRp;

            // 2. Physical YTD % - must satisfy:
            //    physicalValue >= cumulativeRealisasiRp
            //    physicalValue <= cumulativeAngkas
            //    physicalValue = (physicalPct / 100) * yearlyBudget
            // Determine the active yearly budget for this month
            let currentYearlyBudget = target.target_rp; // Initial

            // March change (Month index 2)
            if (bulanIndex >= 2) {
                const change = BUDGET_CHANGE_MONTHS.find(c => c.month === 2);
                if (change) currentYearlyBudget = Math.round(currentYearlyBudget * change.factor);
            }
            // July change (Month index 6)
            if (bulanIndex >= 6) {
                const change = BUDGET_CHANGE_MONTHS.find(c => c.month === 6);
                if (change) currentYearlyBudget = Math.round(currentYearlyBudget * change.factor);
            }
            // October change (Month index 9)
            if (bulanIndex >= 9) {
                const change = BUDGET_CHANGE_MONTHS.find(c => c.month === 9);
                if (change) currentYearlyBudget = Math.round(currentYearlyBudget * change.factor);
            }

            // 2. Physical YTD % - must satisfy:
            //    physicalValue >= cumulativeRealisasiRp
            //    physicalValue <= cumulativeAngkas
            //    physicalValue = (physicalPct / 100) * currentYearlyBudget
            //    So: physicalPct = (physicalValue / currentYearlyBudget) * 100

            const yearlyBudget = currentYearlyBudget;
            const minPhysicalValue = cumulativeRealisasiRp;
            const maxPhysicalValue = cumulativeAngkas;

            // Target physical slightly above financial (efficiency 1.02-1.08)
            let physicalValue = minPhysicalValue * (1 + (Math.random() * 0.06 + 0.02));

            // Clamp to max
            if (physicalValue > maxPhysicalValue) physicalValue = maxPhysicalValue;

            // Ensure min
            if (physicalValue < minPhysicalValue) physicalValue = minPhysicalValue;

            const physicalYtdPct = Math.min(100, (physicalValue / yearlyBudget) * 100);

            // 3. Monthly K values
            const monthlyTargetK = Math.ceil(target.target_k / 12);
            const prevCumulativeK = cumulativeRealisasiK;
            cumulativeRealisasiK = Math.floor((physicalYtdPct / 100) * target.target_k);
            if (cumulativeRealisasiK < prevCumulativeK) cumulativeRealisasiK = prevCumulativeK;
            const monthlyRealisasiK = cumulativeRealisasiK - prevCumulativeK;

            // Status distribution
            let status: string;
            const rand = Math.random();
            if (bulanIndex < 6) {
                status = rand < 0.85 ? 'diverifikasi' : rand < 0.95 ? 'terkirim' : 'menunggu';
            } else if (bulanIndex < 10) {
                status = rand < 0.70 ? 'diverifikasi' : rand < 0.85 ? 'terkirim' : 'menunggu';
            } else {
                status = rand < 0.50 ? 'diverifikasi' : rand < 0.70 ? 'terkirim' : 'menunggu';
            }

            let permasalahan = '';
            let upaya = '';
            if (financialPerformance < 0.85) {
                permasalahan = randomFrom(permasalahanList.filter(p => p !== ''));
                upaya = randomFrom(upayaList.filter(u => u !== ''));
            }

            laporans.push({
                id: uuidv4(),
                user_id: target.user_id,
                id_kegiatan: Math.ceil(target.id_sub_kegiatan / 3),
                id_sub_kegiatan: target.id_sub_kegiatan,
                id_sumber_anggaran: target.id_sumber_anggaran,
                id_satuan: target.id_satuan,
                target_k: monthlyTargetK * bulanNum, // YTD target
                target_rp: yearlyBudget,
                angkas: cumulativeAngkas,
                realisasi_k: monthlyRealisasiK,         // MONTHLY (delta)
                realisasi_rp: monthlyRealisasiRp,       // MONTHLY (delta) <-- KEY FIX
                realisasi_fisik: Math.round(physicalYtdPct * 100) / 100, // YTD %
                permasalahan: permasalahan,
                upaya: upaya,
                bulan: bulan,
                tahun: TAHUN,
                status: status,
                catatan: null,
                verified_by: null,
                verified_at: status === 'diverifikasi' ? new Date() : null,
            });
        }
    }

    return laporans;
}

async function seed() {
    console.log('🌱 Starting seed for 2025 Dashboard data...\n');
    console.log('📋 Key Changes:');
    console.log('   - realisasi_rp/realisasi_k now store MONTHLY values');
    console.log('   - Budget changes at March (+15%), July (-8%), October (+8%)');
    console.log('   - Hierarchy: Anggaran >= Angkas >= PhysicalValue >= Financial\n');

    try {
        const puskesmasUsers = await User.findAll({
            where: { role: 'puskesmas' },
            attributes: ['id', 'username', 'nama', 'nama_puskesmas'],
            raw: true
        });

        if (puskesmasUsers.length === 0) {
            console.log('❌ No puskesmas users found.');
            return;
        }

        const sampleSize = Math.min(20, puskesmasUsers.length);
        const sampledUsers = puskesmasUsers.sort(() => Math.random() - 0.5).slice(0, sampleSize);

        console.log(`📌 Using ${sampledUsers.length} puskesmas\n`);

        const adminUser = await User.findOne({
            where: { role: 'admin' },
            attributes: ['id'],
            raw: true
        });

        const targets = await generateTargetData(sampledUsers);
        const angkasData = generateAngkasData(targets);
        const laporans = generateLaporanData(targets, angkasData);

        if (adminUser) {
            laporans.forEach(l => {
                if (l.verified_at) l.verified_by = adminUser.id;
            });
        }

        // Count initial vs revision targets
        const initialTargets = targets.filter(t => t.catatan.startsWith('Initial'));
        const revisionTargets = targets.filter(t => t.catatan.startsWith('Budget revision'));

        console.log(`📊 Generated:`);
        console.log(`   - ${initialTargets.length} initial targets`);
        console.log(`   - ${revisionTargets.length} budget revision records`);
        console.log(`   - ${angkasData.length} angkas records`);
        console.log(`   - ${laporans.length} laporan records\n`);

        // Check existing
        const existingTargets = await SubKegiatanTarget.count({
            where: { user_id: sampledUsers.map(u => u.id), tahun: TAHUN }
        });
        const existingLaporans = await Laporan.count({
            where: { user_id: sampledUsers.map(u => u.id), tahun: TAHUN }
        });
        const existingAngkas = await AnggaranKas.count({
            where: { user_id: sampledUsers.map(u => u.id), tahun: TAHUN }
        });

        if (existingTargets > 0 || existingLaporans > 0 || existingAngkas > 0) {
            console.log(`⚠️  Found existing data. Run cleanup first.\n`);
            return;
        }

        console.log('💾 Inserting data...');

        // Insert targets with explicit timestamps using hooks: false
        await SubKegiatanTarget.bulkCreate(targets, {
            ignoreDuplicates: true,
            hooks: false  // Prevents beforeCreate/afterCreate hooks that might override dates
        });

        // Force update timestamps via raw SQL for budget change records
        console.log('   Updating target timestamps...');
        await sequelize.query(`
            UPDATE sub_kegiatan_target 
            SET created_at = '2025-01-01 08:00:00', updated_at = '2025-01-01 08:00:00'
            WHERE tahun = 2025 AND catatan LIKE 'Initial%'
        `);
        for (const change of BUDGET_CHANGE_MONTHS) {
            await sequelize.query(`
                UPDATE sub_kegiatan_target 
                SET created_at = '${change.date} 10:00:00', updated_at = '${change.date} 10:00:00'
                WHERE tahun = 2025 AND catatan LIKE 'Budget revision ${BULAN_LIST[change.month]}%'
            `);
        }
        console.log('   ✅ Targets inserted with backdated timestamps');

        await AnggaranKas.bulkCreate(angkasData, {
            ignoreDuplicates: true,
            hooks: false
        });
        // Update angkas timestamps
        await sequelize.query(`
            UPDATE anggaran_kas 
            SET created_at = '2025-01-01 08:00:00', updated_at = '2025-01-01 08:00:00'
            WHERE tahun = 2025
        `);
        console.log('   ✅ Angkas inserted');

        const batchSize = 100;
        for (let i = 0; i < laporans.length; i += batchSize) {
            await Laporan.bulkCreate(laporans.slice(i, i + batchSize), { ignoreDuplicates: true });
        }
        console.log('   ✅ Laporans inserted');

        // Verify first user's hierarchy
        const testUser = sampledUsers[0];
        const testLaporans = laporans.filter(l => l.user_id === testUser.id).slice(0, 5);
        console.log(`\n📋 Sample hierarchy verification for ${testUser.nama_puskesmas}:`);
        for (const l of testLaporans) {
            const physVal = Math.round((l.realisasi_fisik / 100) * l.target_rp);
            console.log(`   ${l.bulan}: Angkas=${formatRupiah(l.angkas).slice(0, 12)} >= Phys=${formatRupiah(physVal).slice(0, 12)}`);
        }

        console.log('\n✨ Seed completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

async function cleanup() {
    console.log('🧹 Cleanup 2025 data...\n');

    try {
        const puskesmasUsers = await User.findAll({
            where: { role: 'puskesmas' },
            attributes: ['id'],
            raw: true
        });
        const userIds = puskesmasUsers.map((u: any) => u.id);

        const deletedLaporans = await Laporan.destroy({ where: { user_id: userIds, tahun: TAHUN } });
        console.log(`   Deleted ${deletedLaporans} laporans`);

        const deletedAngkas = await AnggaranKas.destroy({ where: { user_id: userIds, tahun: TAHUN } });
        console.log(`   Deleted ${deletedAngkas} angkas`);

        const deletedTargets = await SubKegiatanTarget.destroy({ where: { user_id: userIds, tahun: TAHUN } });
        console.log(`   Deleted ${deletedTargets} targets`);

        console.log('\n✨ Cleanup completed!');
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

async function main() {
    const isCleanup = process.argv.includes('cleanup');

    try {
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        if (isCleanup) {
            await cleanup();
        } else {
            await seed();
        }
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

main();
