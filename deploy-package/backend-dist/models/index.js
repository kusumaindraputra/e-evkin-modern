"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PuskesmasSubKegiatan = exports.SubKegiatan = exports.Kegiatan = exports.Satuan = exports.SumberAnggaran = exports.Laporan = exports.User = void 0;
const User_1 = __importDefault(require("./User"));
exports.User = User_1.default;
const Laporan_1 = __importDefault(require("./Laporan"));
exports.Laporan = Laporan_1.default;
const SumberAnggaran_1 = __importDefault(require("./SumberAnggaran"));
exports.SumberAnggaran = SumberAnggaran_1.default;
const Satuan_1 = __importDefault(require("./Satuan"));
exports.Satuan = Satuan_1.default;
const Kegiatan_1 = __importDefault(require("./Kegiatan"));
exports.Kegiatan = Kegiatan_1.default;
const SubKegiatan_1 = __importDefault(require("./SubKegiatan"));
exports.SubKegiatan = SubKegiatan_1.default;
const PuskesmasSubKegiatan_1 = __importDefault(require("./PuskesmasSubKegiatan"));
exports.PuskesmasSubKegiatan = PuskesmasSubKegiatan_1.default;
// Define associations
User_1.default.hasMany(Laporan_1.default, {
    foreignKey: 'user_id',
    as: 'laporan',
});
Laporan_1.default.belongsTo(User_1.default, {
    foreignKey: 'user_id',
    as: 'user',
});
Laporan_1.default.belongsTo(User_1.default, {
    foreignKey: 'verified_by',
    as: 'verifier',
});
// Laporan -> SumberAnggaran
Laporan_1.default.belongsTo(SumberAnggaran_1.default, {
    foreignKey: 'id_sumber_anggaran',
    as: 'sumberAnggaran',
});
SumberAnggaran_1.default.hasMany(Laporan_1.default, {
    foreignKey: 'id_sumber_anggaran',
    as: 'laporan',
});
// Laporan -> Satuan
Laporan_1.default.belongsTo(Satuan_1.default, {
    foreignKey: 'id_satuan',
    as: 'satuan',
});
Satuan_1.default.hasMany(Laporan_1.default, {
    foreignKey: 'id_satuan',
    as: 'laporan',
});
// Laporan -> SubKegiatan
Laporan_1.default.belongsTo(SubKegiatan_1.default, {
    foreignKey: 'id_sub_kegiatan',
    as: 'subKegiatan',
});
SubKegiatan_1.default.hasMany(Laporan_1.default, {
    foreignKey: 'id_sub_kegiatan',
    as: 'laporan',
});
//# sourceMappingURL=index.js.map