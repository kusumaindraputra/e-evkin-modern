import { Model, Optional } from 'sequelize';
interface SatuanAttributes {
    id_satuan: number;
    satuannya: string;
}
interface SatuanCreationAttributes extends Optional<SatuanAttributes, 'id_satuan'> {
}
declare class Satuan extends Model<SatuanAttributes, SatuanCreationAttributes> implements SatuanAttributes {
    id_satuan: number;
    satuannya: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default Satuan;
//# sourceMappingURL=Satuan.d.ts.map