/**
 * Verify data hierarchy by SIMULATING dashboard aggregation
 * Rule: Anggaran >= Angkas >= Realisasi Fisik (Value) >= Realisasi Anggaran
 * 
 * IMPORTANT: Laporan stores MONTHLY values, so we must accumulate to check hierarchy
 */

import { sequelize, Laporan, SubKegiatanTarget, AnggaranKas } from '../models';

const BULAN_LIST = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
}

async function checkHierarchy() {
    console.log('🔍 Checking Data Hierarchy (Simulating Dashboard Aggregation)...\n');
    console.log('Rule: Anggaran >= Angkas >= PhysicalValue >= FinancialValue\n');

    try {
        // Get a sample user with data
        const sampleLaporan = await Laporan.findOne({
            where: { tahun: 2025 },
            raw: true
        }) as any;

        if (!sampleLaporan) {
            console.log('❌ No data found for 2025');
            return;
        }

        const userId = sampleLaporan.user_id;
        const subKegId = sampleLaporan.id_sub_kegiatan;
        const sumberId = sampleLaporan.id_sumber_anggaran;

        console.log(`📋 Testing user_id: ${userId.slice(0, 8)}...`);
        console.log(`   sub_kegiatan: ${subKegId}, sumber: ${sumberId}\n`);

        // Get targets with history
        const targets = await SubKegiatanTarget.findAll({
            where: { user_id: userId, id_sub_kegiatan: subKegId, id_sumber_anggaran: sumberId, tahun: 2025 },
            order: [['created_at', 'ASC']],
            raw: true
        });
        console.log(`   Found ${targets.length} target records (including revisions)\n`);

        // Get angkas
        const angkasRecords = await AnggaranKas.findAll({
            where: { user_id: userId, id_sub_kegiatan: subKegId, id_sumber_anggaran: sumberId, tahun: 2025 },
            raw: true
        });

        // Get laporans
        const laporans = await Laporan.findAll({
            where: { user_id: userId, id_sub_kegiatan: subKegId, id_sumber_anggaran: sumberId, tahun: 2025 },
            raw: true
        });

        // Simulate dashboard logic per month
        console.log('------------------------------------------------------------------------------------------------');
        console.log(
            String('Month').padEnd(12) +
            String('Anggaran').padEnd(16) +
            String('Angkas(Cum)').padEnd(16) +
            String('PhysVal').padEnd(16) +
            String('FinVal(Cum)').padEnd(16) +
            String('Valid?')
        );
        console.log('------------------------------------------------------------------------------------------------');

        let cumulativeFinancial = 0;
        let maxPhysicalPct = 0;
        let validCount = 0;
        let totalMonths = 0;

        for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
            const monthName = BULAN_LIST[monthIdx];
            const monthNum = monthIdx + 1;
            const cutoffDate = new Date(2025, monthNum, 0, 23, 59, 59);

            // Get anggaran valid at this month
            let anggaran = 0;
            for (const t of targets) {
                if (new Date((t as any).createdAt) <= cutoffDate) {
                    anggaran = Number((t as any).target_rp);
                }
            }

            // Get cumulative angkas
            const cumulativeAngkas = angkasRecords
                .filter((a: any) => a.bulan <= monthNum)
                .reduce((sum: number, a: any) => sum + Number(a.nilai), 0);

            // Get monthly financial and physical for this month
            const monthLaporan = laporans.find((l: any) => l.bulan === monthName);
            if (!monthLaporan) continue;

            totalMonths++;

            // Financial is MONTHLY in DB, accumulate
            cumulativeFinancial += Number((monthLaporan as any).realisasi_rp);

            // Physical is YTD %, carry forward max
            const monthPhysPct = Number((monthLaporan as any).realisasi_fisik);
            maxPhysicalPct = Math.max(maxPhysicalPct, monthPhysPct);

            // Physical VALUE = pct * anggaran
            const physicalValue = Math.round((maxPhysicalPct / 100) * anggaran);

            // Check hierarchy
            const valid = (anggaran >= cumulativeAngkas) &&
                (cumulativeAngkas >= physicalValue - 1000) &&
                (physicalValue >= cumulativeFinancial - 1000);

            if (valid) validCount++;

            console.log(
                String(monthName).padEnd(12) +
                String(formatRupiah(anggaran)).slice(0, 14).padEnd(16) +
                String(formatRupiah(cumulativeAngkas)).slice(0, 14).padEnd(16) +
                String(formatRupiah(physicalValue)).slice(0, 14).padEnd(16) +
                String(formatRupiah(cumulativeFinancial)).slice(0, 14).padEnd(16) +
                (valid ? '✅' : '❌')
            );

            if (!valid) {
                if (anggaran < cumulativeAngkas) console.log('    ⚠ Angkas > Anggaran');
                if (cumulativeAngkas < physicalValue) console.log('    ⚠ Physical > Angkas');
                if (physicalValue < cumulativeFinancial) console.log('    ⚠ Financial > Physical');
            }
        }

        console.log('------------------------------------------------------------------------------------------------');
        console.log(`\n📊 Summary: ${validCount}/${totalMonths} months valid (${Math.round(validCount / totalMonths * 100)}%)`);

        if (validCount === totalMonths) {
            console.log('✨ All hierarchy rules passed!');
        } else {
            console.log('⚠️ Some violations found.');
        }

        // Also check budget changes
        console.log('\n📅 Budget change verification:');
        for (const t of targets) {
            console.log(`   ${new Date((t as any).createdAt).toISOString().slice(0, 10)}: ${formatRupiah(Number((t as any).target_rp))}`);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

checkHierarchy().then(() => sequelize.close());
