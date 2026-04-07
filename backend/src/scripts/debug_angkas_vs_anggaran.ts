import { SubKegiatanTarget, AnggaranKas, User } from '../models';
import sequelize from '../config/database';
import { Op } from 'sequelize';

async function main() {
    try {
        await sequelize.authenticate();
        console.log('DB connected\n');

        // Find Bojonggede user
        const users = await User.findAll({
            where: { nama_puskesmas: { [Op.iLike]: '%bojonggede%' } },
            logging: false
        });
        if (users.length === 0) { console.log('Bojonggede user not found'); return; }
        const user = users[0];
        console.log(`User: ${user.id} - ${(user as any).nama_puskesmas}\n`);

        const tahun = 2026;

        // Fetch targets & angkas (same as dashboardService.getChartData)
        const allTargets = await SubKegiatanTarget.findAll({
            where: { tahun, user_id: user.id },
            order: [['created_at', 'ASC']],
            raw: true, nest: true, logging: false
        });

        const allAngkas = await AnggaranKas.findAll({
            where: { tahun, user_id: user.id },
            order: [['created_at', 'ASC']],
            raw: true, logging: false
        });

        console.log(`Total target records: ${allTargets.length}`);
        console.log(`Total angkas records: ${allAngkas.length}\n`);

        // === Replicate exact dashboardService logic ===

        const getAnggaranForMonth = (targets: any[], year: number, monthNum: number) => {
            const cutoffDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
            const grouped = new Map();
            targets.forEach((t: any) => {
                const createdAt = new Date(t.created_at || t.createdAt);
                if (createdAt <= cutoffDate) {
                    const key = `${t.user_id}_${t.id_sub_kegiatan}_${t.id_sumber_anggaran}_${t.tahun}`;
                    grouped.set(key, t);
                }
            });
            return Array.from(grouped.values());
        };

        const getCumulativeAngkas = (angkas: any[], year: number, monthNum: number) => {
            const cutoffDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
            const latestPerKeyPerMonth = new Map();
            angkas.forEach((a: any) => {
                const createdAt = new Date(a.created_at || a.createdAt);
                if (createdAt <= cutoffDate && a.bulan <= monthNum) {
                    const keyMonth = `${a.user_id}_${a.kode_rekening}_${a.id_sumber_anggaran}_${a.tahun}_${a.bulan}`;
                    latestPerKeyPerMonth.set(keyMonth, a);
                }
            });

            // Find sub_kegiatan IDs that have MANUAL entries
            const subKegWithManual = new Set<number>();
            latestPerKeyPerMonth.forEach((record: any) => {
                if (record.kode_rekening?.startsWith('MANUAL-') && record.id_sub_kegiatan) {
                    subKegWithManual.add(record.id_sub_kegiatan);
                }
            });

            let total = 0;
            latestPerKeyPerMonth.forEach((record: any) => {
                if (subKegWithManual.has(record.id_sub_kegiatan) && !record.kode_rekening?.startsWith('MANUAL-')) {
                    return; // skip PDF entry — MANUAL split replaces it
                }
                total += Number(record.nilai) || 0;
            });
            return total;
        };

        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        console.log('=== CHART DATA (same as dashboard) ===');
        console.log('Bulan          | Anggaran         | Angkas (cum)     | Angkas > Anggaran?');
        console.log('-'.repeat(80));

        for (let i = 0; i < 12; i++) {
            const monthNum = i + 1;
            const targetsForMonth = getAnggaranForMonth(allTargets, tahun, monthNum);
            const anggaran = targetsForMonth.reduce((sum: number, t: any) => sum + (Number(t.target_rp) || 0), 0);
            const angkas = getCumulativeAngkas(allAngkas, tahun, monthNum);
            const flag = angkas > anggaran ? ' ⚠️ YES' : '';
            console.log(`${months[i].padEnd(14)} | ${anggaran.toLocaleString().padStart(16)} | ${angkas.toLocaleString().padStart(16)} |${flag}`);
        }

        // Breakdown: what sub_kegiatan are in targets vs angkas
        console.log('\n=== TARGET BREAKDOWN (SubKegiatanTarget) ===');
        const targetsBySubKegiatan = new Map();
        allTargets.forEach((t: any) => {
            const key = `${t.id_sub_kegiatan}_${t.id_sumber_anggaran}`;
            if (!targetsBySubKegiatan.has(key)) targetsBySubKegiatan.set(key, { records: [], total: 0 });
            const entry = targetsBySubKegiatan.get(key);
            entry.records.push(t);
            entry.total = Number(t.target_rp) || 0; // latest wins
        });
        let totalTargetRp = 0;
        targetsBySubKegiatan.forEach((v, k) => {
            console.log(`  SubKeg ${k}: ${v.records.length} records, latest target_rp = ${v.total.toLocaleString()}`);
            totalTargetRp += v.total;
        });
        console.log(`  TOTAL: ${totalTargetRp.toLocaleString()}`);

        console.log('\n=== ANGKAS BREAKDOWN (AnggaranKas) ===');
        const angkasByKodeRekening = new Map();
        allAngkas.forEach((a: any) => {
            const key = `${a.kode_rekening}_${a.id_sumber_anggaran}`;
            if (!angkasByKodeRekening.has(key)) angkasByKodeRekening.set(key, { total: 0, months: new Set(), subKeg: a.id_sub_kegiatan });
            const entry = angkasByKodeRekening.get(key);
            entry.total += Number(a.nilai) || 0;
            entry.months.add(a.bulan);
        });
        let totalAngkasNilai = 0;
        angkasByKodeRekening.forEach((v, k) => {
            console.log(`  Rek ${k}: subKeg=${v.subKeg}, ${v.months.size} bulan, total nilai = ${v.total.toLocaleString()}`);
            totalAngkasNilai += v.total;
        });
        console.log(`  TOTAL ALL MONTHS: ${totalAngkasNilai.toLocaleString()}`);

        // Check for duplicate angkas records (same key but multiple created_at)
        console.log('\n=== DUPLICATE CHECK (angkas records per unique key) ===');
        const angkasKeyCount = new Map();
        allAngkas.forEach((a: any) => {
            const key = `${a.user_id}_${a.kode_rekening}_${a.id_sumber_anggaran}_${a.tahun}_${a.bulan}`;
            angkasKeyCount.set(key, (angkasKeyCount.get(key) || 0) + 1);
        });
        const duplicates = Array.from(angkasKeyCount.entries()).filter(([, count]) => count > 1);
        if (duplicates.length > 0) {
            console.log(`  Found ${duplicates.length} duplicate keys:`);
            duplicates.forEach(([key, count]) => console.log(`    ${key}: ${count} records`));
        } else {
            console.log('  No duplicates found');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

main();
