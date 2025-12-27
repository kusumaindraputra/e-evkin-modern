import { Model, Optional } from 'sequelize';
interface SubKegiatanAttributes {
    id_sub_kegiatan: number;
    id_kegiatan: number;
    kode_sub: string;
    kegiatan: string;
    indikator_kinerja: string;
}
interface SubKegiatanCreationAttributes extends Optional<SubKegiatanAttributes, 'id_sub_kegiatan'> {
}
declare class SubKegiatan extends Model<SubKegiatanAttributes, SubKegiatanCreationAttributes> implements SubKegiatanAttributes {
    id_sub_kegiatan: number;
    id_kegiatan: number;
    kode_sub: string;
    kegiatan: string;
    indikator_kinerja: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default SubKegiatan;
//# sourceMappingURL=SubKegiatan.d.ts.map