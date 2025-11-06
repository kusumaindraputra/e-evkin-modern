import { Model, Optional } from 'sequelize';
interface KegiatanAttributes {
    id_kegiatan: number;
    id_uraian: number;
    kode: string;
    kegiatan: string;
}
interface KegiatanCreationAttributes extends Optional<KegiatanAttributes, 'id_kegiatan'> {
}
declare class Kegiatan extends Model<KegiatanAttributes, KegiatanCreationAttributes> implements KegiatanAttributes {
    id_kegiatan: number;
    id_uraian: number;
    kode: string;
    kegiatan: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default Kegiatan;
//# sourceMappingURL=Kegiatan.d.ts.map