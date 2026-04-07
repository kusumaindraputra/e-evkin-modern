import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

/**
 * Cleanup script: removes all transactional/test data, preserving master data.
 *
 * DELETED: laporan, anggaran_kas, sub_kegiatan_target
 * KEPT:    users, satuan, sumber_anggaran, kegiatan, sub_kegiatan,
 *          puskesmas_sub_kegiatan, sub_kegiatan_sumber_dana, puskesmas_edit_permission
 */
async function main() {
    try {
        await sequelize.authenticate();
        console.log('DB connected\n');

        // Show current counts before deletion
        console.log('=== BEFORE CLEANUP ===');
        const tables = ['laporan', 'anggaran_kas', 'sub_kegiatan_target'];
        for (const table of tables) {
            const [result]: any = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`, { type: QueryTypes.SELECT });
            console.log(`  ${table}: ${result.count} records`);
        }

        console.log('\n=== MASTER DATA (will be kept) ===');
        const masterTables = ['users', 'satuan', 'sumber_anggaran', 'kegiatan', 'sub_kegiatan', 'puskesmas_sub_kegiatan', 'sub_kegiatan_sumber_dana', 'puskesmas_edit_permission'];
        for (const table of masterTables) {
            try {
                const [result]: any = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`, { type: QueryTypes.SELECT });
                console.log(`  ${table}: ${result.count} records`);
            } catch {
                console.log(`  ${table}: (table not found)`);
            }
        }

        console.log('\n=== DELETING TRANSACTIONAL DATA ===');

        // Delete in order respecting foreign keys (child tables first)
        // laporan has no children, anggaran_kas has no children, sub_kegiatan_target has no children
        const t = await sequelize.transaction();
        try {
            for (const table of tables) {
                const [, meta]: any = await sequelize.query(`DELETE FROM ${table}`, { transaction: t });
                console.log(`  Deleted from ${table}: ${meta?.rowCount ?? 'OK'}`);
            }
            await t.commit();
            console.log('\nTransaction committed successfully.');
        } catch (err) {
            await t.rollback();
            console.error('\nTransaction rolled back due to error:', err);
            process.exit(1);
        }

        // Verify
        console.log('\n=== AFTER CLEANUP ===');
        for (const table of tables) {
            const [result]: any = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`, { type: QueryTypes.SELECT });
            console.log(`  ${table}: ${result.count} records`);
        }

        console.log('\nCleanup complete.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

main();
