import { QueryInterface } from 'sequelize';
/**
 * Migration to add missing columns to sub_kegiatan_target table
 * Required for proper operation with Excel upload and target management
 */
declare const _default: {
    up: (queryInterface: QueryInterface) => Promise<void>;
    down: (queryInterface: QueryInterface) => Promise<void>;
};
export default _default;
//# sourceMappingURL=add_sumber_anggaran_to_target.d.ts.map