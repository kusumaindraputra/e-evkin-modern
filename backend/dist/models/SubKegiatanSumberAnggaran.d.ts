import { Model, Optional } from 'sequelize';
interface SubKegiatanSumberAnggaranAttributes {
    id: number;
    id_sub_kegiatan: number;
    id_sumber_anggaran: number;
    is_active: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
interface SubKegiatanSumberAnggaranCreationAttributes extends Optional<SubKegiatanSumberAnggaranAttributes, 'id' | 'is_active' | 'createdAt' | 'updatedAt'> {
}
declare class SubKegiatanSumberAnggaran extends Model<SubKegiatanSumberAnggaranAttributes, SubKegiatanSumberAnggaranCreationAttributes> implements SubKegiatanSumberAnggaranAttributes {
    id: number;
    id_sub_kegiatan: number;
    id_sumber_anggaran: number;
    is_active: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default SubKegiatanSumberAnggaran;
//# sourceMappingURL=SubKegiatanSumberAnggaran.d.ts.map