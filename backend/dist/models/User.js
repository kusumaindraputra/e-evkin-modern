"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const bcrypt_1 = __importDefault(require("bcrypt"));
class User extends sequelize_1.Model {
    // Instance methods
    async comparePassword(candidatePassword) {
        if (!this.password) {
            return false;
        }
        return bcrypt_1.default.compare(candidatePassword, this.password);
    }
    // Static methods
    static async hashPassword(password) {
        return bcrypt_1.default.hash(password, 10);
    }
    // Exclude password from JSON
    toJSON() {
        const values = Object.assign({}, this.get());
        delete values.password;
        return values;
    }
}
User.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    username: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 100],
        },
    },
    password: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    nama: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('puskesmas', 'admin'),
        allowNull: false,
        defaultValue: 'puskesmas',
    },
    kode_puskesmas: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    nama_puskesmas: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: true,
    },
    id_blud: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    kecamatan: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    wilayah: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'users',
    underscored: true,
    timestamps: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await User.hashPassword(user.password);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await User.hashPassword(user.password);
            }
        },
    },
});
exports.default = User;
//# sourceMappingURL=User.js.map