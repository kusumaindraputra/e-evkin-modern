/**
 * COMPREHENSIVE DEBUG SCRIPT
 * 
 * This script simulates EXACTLY what the dashboard endpoint does,
 * step by step, to identify where the hierarchy breaks.
 * 
 * Rule: Anggaran >= Angkas >= Realisasi Fisik (Value) >= Realisasi Anggaran
 */

import { sequelize, Laporan, SubKegiatanTarget, AnggaranKas, User } from '../models';
import { Op } from 'sequelize';

const BULAN_LIST = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID').format(value);
}

async function debugDashboardData() {
    console.log('🔍 COMPREHENSIVE DEBUG: Dashboard Data Flow\n');
    console.log('='.repeat(100));

    try {
        // Step 1: Find a puskesmas with 2025 data
        const sampleLaporan = await Laporan.findOne({
            where: { tahun: 2025, status: { [Op.in]: ['terkirim', 'menunggu', 'diverifikasi'] } },
            raw: true
        }) as any;

        if (!sampleLaporan) {
            console.log('❌ No 2025 data found. Run seeder first.');
            return;
        }

        const userId = sampleLaporan.user_id;
        console.log(`\n📌 Testing User ID: ${userId.slice(0, 8)}...`);

        // Step 2: Get all targets with history (like dashboard does)
        const allTargets = await SubKegiatanTarget.findAll({
            where: { user_id: userId, tahun: 2025 },
            order: [['created_at', 'ASC']],
            raw: true
        }) as any[];

        console.log(`\n📊 TARGETS (SubKegiatanTarget) - ${allTargets.length} records:`);
        for (const t of allTargets) {
            console.log(`   ${new Date(t.createdAt).toISOString().slice(0, 10)} | SubKeg ${t.id_sub_kegiatan} | Sumber ${t.id_sumber_anggaran} | ${formatRupiah(t.target_rp)}`);
        }

        // Step 3: Get all angkas
        const allAngkas = await AnggaranKas.findAll({
            where: { user_id: userId, tahun: 2025 },
            order: [['bulan', 'ASC']],
            raw: true
        }) as any[];

        console.log(`\n📊 ANGKAS (AnggaranKas) - ${allAngkas.length} records`);

        // Step 4: Get all laporans
        const allLaporans = await Laporan.findAll({
            where: {
                user_id: userId,
                tahun: 2025,
                status: { [Op.in]: ['terkirim', 'menunggu', 'diverifikasi'] }
            },
            order: [['bulan', 'ASC']],
            raw: true
        }) as any[];

        console.log(`📊 LAPORANS - ${allLaporans.length} records`);

        // Step 5: Simulate dashboard aggregation per month
        console.log('\n' + '='.repeat(100));
        console.log('DASHBOARD SIMULATION (Same logic as /api/admin/dashboard/chart-data)');
        console.log('='.repeat(100));
        console.log('\n' +
            'Month'.padEnd(12) +
            'Anggaran'.padEnd(18) +
            'Angkas(Cum)'.padEnd(18) +
            'FinVal(Cum)'.padEnd(18) +
            'PhysVal'.padEnd(18) +
            'Phys%'.padEnd(8) +
            'Valid?'
        );
        console.log('-'.repeat(100));

        let prevRealisasiAnggaran = 0;
        let maxRealisasiFisik = 0;
        let violations: string[] = [];

        for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
            const monthName = BULAN_LIST[monthIdx];
            const monthNum = monthIdx + 1;
            const cutoffDate = new Date(2025, monthNum, 0, 23, 59, 59, 999);

            // 1. Get ANGGARAN valid at this month (dashboard logic)
            let anggaran = 0;
            const grouped = new Map();
            for (const t of allTargets) {
                const createdAt = new Date(t.createdAt);
                if (createdAt <= cutoffDate) {
                    const key = `${t.id_sub_kegiatan}_${t.id_sumber_anggaran}`;
                    grouped.set(key, t);
                }
            }
            for (const t of grouped.values()) {
                anggaran += Number(t.target_rp) || 0;
            }

            // 2. Get CUMULATIVE ANGKAS to this month (dashboard logic)
            const latestAngkasPerKey = new Map();
            for (const a of allAngkas) {
                const createdAt = new Date(a.createdAt);
                if (createdAt <= cutoffDate && a.bulan <= monthNum) {
                    const keyMonth = `${a.id_sub_kegiatan}_${a.id_sumber_anggaran}_${a.bulan}`;
                    latestAngkasPerKey.set(keyMonth, a);
                }
            }
            let cumulativeAngkas = 0;
            for (const a of latestAngkasPerKey.values()) {
                cumulativeAngkas += Number(a.nilai) || 0;
            }

            // 3. Get MONTHLY realisasi for this month, then accumulate (dashboard logic)
            const laporanForMonth = allLaporans.filter(l => l.bulan === monthName);
            const monthlyRealisasiRp = laporanForMonth.reduce((sum, l) => sum + (Number(l.realisasi_rp) || 0), 0);
            const cumulativeRealisasiAnggaran = prevRealisasiAnggaran + monthlyRealisasiRp;
            prevRealisasiAnggaran = cumulativeRealisasiAnggaran;

            // 4. Get average physical % for this month, then carry forward MAX (dashboard logic)
            const totalFisik = laporanForMonth.reduce((sum, l) => sum + (Number(l.realisasi_fisik) || 0), 0);
            const countFisik = laporanForMonth.length;
            const avgFisik = countFisik > 0 ? totalFisik / countFisik : 0;
            maxRealisasiFisik = Math.max(maxRealisasiFisik, avgFisik);

            // 5. Calculate Physical VALUE = % * Anggaran
            const physicalValue = Math.round((maxRealisasiFisik / 100) * anggaran);

            // 6. Check hierarchy
            const valid =
                anggaran >= cumulativeAngkas &&
                cumulativeAngkas >= physicalValue &&
                physicalValue >= cumulativeRealisasiAnggaran;

            const validStr = valid ? '✅' : '❌';

            if (!valid) {
                let reasons: string[] = [];
                if (anggaran < cumulativeAngkas) reasons.push('Angkas > Anggaran');
                if (cumulativeAngkas < physicalValue) reasons.push(`Physical > Angkas (diff: ${formatRupiah(physicalValue - cumulativeAngkas)})`);
                if (physicalValue < cumulativeRealisasiAnggaran) reasons.push(`Financial > Physical (diff: ${formatRupiah(cumulativeRealisasiAnggaran - physicalValue)})`);
                violations.push(`${monthName}: ${reasons.join(', ')}`);
            }

            console.log(
                monthName.padEnd(12) +
                formatRupiah(anggaran).padEnd(18) +
                formatRupiah(cumulativeAngkas).padEnd(18) +
                formatRupiah(cumulativeRealisasiAnggaran).padEnd(18) +
                formatRupiah(physicalValue).padEnd(18) +
                maxRealisasiFisik.toFixed(2).padEnd(8) +
                validStr
            );
        }

        console.log('-'.repeat(100));

        if (violations.length > 0) {
            console.log('\n❌ VIOLATIONS FOUND:');
            for (const v of violations) {
                console.log(`   • ${v}`);
            }
        } else {
            console.log('\n✅ ALL MONTHS VALID!');
        }

        // Step 6: Show sample raw Laporan data
        console.log('\n' + '='.repeat(100));
        console.log('RAW LAPORAN DATA (first 5 records):');
        console.log('='.repeat(100));
        console.log(
            'Bulan'.padEnd(12) +
            'realisasi_rp'.padEnd(18) +
            'realisasi_fisik'.padEnd(18) +
            'angkas (stored)'.padEnd(18)
        );
        console.log('-'.repeat(70));
        for (const l of allLaporans.slice(0, 5)) {
            console.log(
                l.bulan.padEnd(12) +
                formatRupiah(l.realisasi_rp).padEnd(18) +
                String(l.realisasi_fisik).padEnd(18) +
                formatRupiah(l.angkas).padEnd(18)
            );
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

debugDashboardData().then(() => sequelize.close());
