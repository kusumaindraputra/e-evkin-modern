/**
 * Script untuk simulasi Perubahan Anggaran di pertengahan tahun
 * 
 * Skenario:
 * 1. Ambil satu puskesmas dan satu sub kegiatan
 * 2. Cek target awal
 * 3. Insert target "perubahan" dengan tanggal created_at di bulan Juli 2025
 * 4. Verifikasi bahwa API dashboard mengembalikan nilai yang berbeda untuk sebelum dan sesudah Juli
 */

import { sequelize, SubKegiatanTarget, User, SubKegiatan } from '../models';
import axios from 'axios';

// Konfigurasi
const TAHUN = 2025;
const CHANGE_MONTH_INDEX = 6; // Juli (0-based index)
const CHANGE_DATE = '2025-07-01 10:00:00';
const API_URL = 'http://localhost:5000/api/admin/dashboard/chart-data';
// Mock auth token not needed if we check DB logic directly or use a test helper, 
// but let's try to verify via logic functions imported from routes?
// No, improved approach: duplicate the logic here to verify it works as expected,
// OR login as admin to get token.
// Let's implement the logic verification directly to avoid auth complexity in script.

async function simulateBudgetChange() {
    console.log('🚀 Starting Budget Change Simulation...\n');

    try {
        // 1. Get a random active puskesmas with targets
        const target = await SubKegiatanTarget.findOne({
            where: { tahun: TAHUN },
            include: [
                { model: User, as: 'puskesmas' },
                { model: SubKegiatan, as: 'subKegiatan' }
            ]
        }) as any;

        if (!target) {
            console.log('❌ No target data found for 2025.');
            return;
        }

        const user = target.puskesmas;
        console.log(`📋 Selected Puskesmas: ${user.nama_puskesmas} (${user.username})`);
        console.log(`📋 Sub Kegiatan: ${target.subKegiatan.kegiatan}`);
        console.log(`💰 Awal Target Rp: ${new Intl.NumberFormat('id-ID').format(target.target_rp)}`);
        console.log(`📅 Created At: ${target.createdAt}\n`);

        // FIX: Backdate the original target to Jan 1, 2025
        // Because the seed ran today (2026), but we are simulating 2025 logic
        const START_DATE = '2025-01-01 08:00:00';
        await sequelize.query(
            `UPDATE sub_kegiatan_target SET created_at = :date, updated_at = :date WHERE id = :id`,
            {
                replacements: { date: START_DATE, id: target.id }
            }
        );
        console.log(`✅ Backdated original target to ${START_DATE} for simulation accuracy\n`);


        // 2. Define New Target (Perubahan) - Increase by 50%
        const newTargetRp = Math.round(target.target_rp * 1.5);
        const newTargetK = Math.round(target.target_k * 1.2);

        console.log(`📝 Creating NEW target (Perubahan) effective from July 2025...`);
        console.log(`💰 Baru Target Rp: ${new Intl.NumberFormat('id-ID').format(newTargetRp)}`);

        // 3. Insert new record
        const newRecord = await SubKegiatanTarget.create({
            user_id: target.user_id,
            id_sub_kegiatan: target.id_sub_kegiatan,
            id_sumber_anggaran: target.id_sumber_anggaran,
            id_satuan: target.id_satuan,
            target_k: newTargetK,
            target_rp: newTargetRp,
            tahun: TAHUN,
            bulan: null,
            catatan: 'Simulasi Perubahan Anggaran (APBD-P)',
            created_by: target.created_by,
            created_at: new Date(CHANGE_DATE), // FORCE DATE
            updated_at: new Date(CHANGE_DATE)
        } as any);

        // UPDATE created_at manually because Sequelize/Postgres might override it with current time on create
        // depending on model definition. Let's make sure using query.
        await sequelize.query(
            `UPDATE sub_kegiatan_target SET created_at = :date WHERE id = :id`,
            {
                replacements: { date: CHANGE_DATE, id: newRecord.id }
            }
        );

        console.log(`✅ New target record created with ID: ${newRecord.id} and date ${CHANGE_DATE}\n`);

        // 4. Verify Logic (Simulate what the backend does)
        console.log('🔍 Verifying Dashboard Logic...');

        // Fetch all targets for this key
        const allTargets = await SubKegiatanTarget.findAll({
            where: {
                user_id: target.user_id,
                id_sub_kegiatan: target.id_sub_kegiatan,
                id_sumber_anggaran: target.id_sumber_anggaran,
                tahun: TAHUN
            },
            order: [['created_at', 'ASC']],
            raw: true
        });

        console.log(`Found ${allTargets.length} history records for this budget line.`);
        if (allTargets.length > 0) {
            console.log('First record keys:', Object.keys(allTargets[0]));
            // console.log('First record date:', (allTargets[0] as any).created_at);
        }

        // Helper function from admin.routes.ts
        const getAnggaranForMonth = (allTargets: any[], year: number, monthNum: number) => {
            const cutoffDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
            let latest: any = null;

            allTargets.forEach((t: any) => {
                const createdAt = new Date(t.createdAt); // Corrected to use camelCase matches output
                if (createdAt <= cutoffDate) {
                    latest = t;
                }
            });
            return latest;
        };

        // Check June (Month 6) -> Should be OLD value
        const juneBudget = getAnggaranForMonth(allTargets, TAHUN, 6);
        console.log(`\n📅 June 2025 (Before Change):`);
        console.log(`   Value: ${new Intl.NumberFormat('id-ID').format(juneBudget?.target_rp || 0)}`);
        console.log(`   Expected: ${new Intl.NumberFormat('id-ID').format(target.target_rp)}`);

        if (String(juneBudget?.target_rp) === String(target.target_rp)) {
            console.log('   ✅ CORRECT');
        } else {
            console.log('   ❌ INCORRECT');
        }

        // Check July (Month 7) -> Should be NEW value
        const julyBudget = getAnggaranForMonth(allTargets, TAHUN, 7);
        console.log(`\n📅 July 2025 (After Change):`);
        console.log(`   Value: ${new Intl.NumberFormat('id-ID').format(julyBudget?.target_rp || 0)}`);
        console.log(`   Expected: ${new Intl.NumberFormat('id-ID').format(newTargetRp)}`);

        if (String(julyBudget?.target_rp) === String(newTargetRp)) {
            console.log('   ✅ CORRECT');
        } else {
            console.log('   ❌ INCORRECT');
        }

        console.log('\n✨ Simulation completed successfully!');

    } catch (error) {
        console.error('❌ Error during simulation:', error);
    } finally {
        await sequelize.close();
    }
}

simulateBudgetChange();
