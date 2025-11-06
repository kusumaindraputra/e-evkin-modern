import { Model, Optional } from 'sequelize';
interface SumberAnggaranAttributes {
    id_sumber: number;
    sumber: string;
}
interface SumberAnggaranCreationAttributes extends Optional<SumberAnggaranAttributes, 'id_sumber'> {
}
declare class SumberAnggaran extends Model<SumberAnggaranAttributes, SumberAnggaranCreationAttributes> implements SumberAnggaranAttributes {
    id_sumber: number;
    sumber: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default SumberAnggaran;
//# sourceMappingURL=SumberAnggaran.d.ts.map