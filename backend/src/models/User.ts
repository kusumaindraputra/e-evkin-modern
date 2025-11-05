import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcrypt';

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

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare username: string;
  declare password: string;
  declare nama: string;
  declare role: 'puskesmas' | 'admin';
  declare kode_puskesmas?: string;
  declare nama_puskesmas?: string;
  declare id_blud?: string;
  declare kecamatan?: string;
  declare wilayah?: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Instance methods
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    if (!this.password) {
      return false;
    }
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Static methods
  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Exclude password from JSON
  public toJSON(): Partial<UserAttributes> {
    const values: any = Object.assign({}, this.get());
    delete values.password;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 100],
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    nama: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('puskesmas', 'admin'),
      allowNull: false,
      defaultValue: 'puskesmas',
    },
    kode_puskesmas: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    nama_puskesmas: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    id_blud: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    kecamatan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    wilayah: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    underscored: true,
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          user.password = await User.hashPassword(user.password);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          user.password = await User.hashPassword(user.password);
        }
      },
    },
  }
);

export default User;
