import { Model, Optional } from 'sequelize';
interface UserAttributes {
    id: string;
    username: string;
    password: string;
    nama: string;
    role: 'puskesmas' | 'admin';
    kode_puskesmas?: string;
    nama_puskesmas?: string;
    id_blud?: string;
    kecamatan?: string;
    wilayah?: string;
    created_at?: Date;
    updated_at?: Date;
}
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at'> {
}
declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: string;
    username: string;
    password: string;
    nama: string;
    role: 'puskesmas' | 'admin';
    kode_puskesmas?: string;
    nama_puskesmas?: string;
    id_blud?: string;
    kecamatan?: string;
    wilayah?: string;
    readonly created_at: Date;
    readonly updated_at: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    static hashPassword(password: string): Promise<string>;
    toJSON(): Partial<UserAttributes>;
}
export default User;
//# sourceMappingURL=User.d.ts.map