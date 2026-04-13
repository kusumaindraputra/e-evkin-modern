import User from './User';
import Laporan from './Laporan';
import SumberAnggaran from './SumberAnggaran';
import Satuan from './Satuan';
import Kegiatan from './Kegiatan';
import SubKegiatan from './SubKegiatan';
import PuskesmasSubKegiatan from './PuskesmasSubKegiatan';
import SubKegiatanSumberAnggaran from './SubKegiatanSumberAnggaran';
import SubKegiatanTarget from './SubKegiatanTarget';
import AnggaranKas from './AnggaranKas';
import PuskesmasEditPermission from './PuskesmasEditPermission';
import LraUploadBatch from './LraUploadBatch';
import LraRealisasi from './LraRealisasi';
import { sequelize } from '../config/database';

// Define associations
User.hasMany(Laporan, {
  foreignKey: 'user_id',
  as: 'laporan',
});

Laporan.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

Laporan.belongsTo(User, {
  foreignKey: 'verified_by',
  as: 'verifier',
});

// Laporan -> SumberAnggaran
Laporan.belongsTo(SumberAnggaran, {
  foreignKey: 'id_sumber_anggaran',
  as: 'sumberAnggaran',
});

SumberAnggaran.hasMany(Laporan, {
  foreignKey: 'id_sumber_anggaran',
  as: 'laporan',
});

// Laporan -> Satuan
Laporan.belongsTo(Satuan, {
  foreignKey: 'id_satuan',
  as: 'satuan',
});

Satuan.hasMany(Laporan, {
  foreignKey: 'id_satuan',
  as: 'laporan',
});

// Laporan -> SubKegiatan
Laporan.belongsTo(SubKegiatan, {
  foreignKey: 'id_sub_kegiatan',
  as: 'subKegiatan',
});

SubKegiatan.hasMany(Laporan, {
  foreignKey: 'id_sub_kegiatan',
  as: 'laporan',
});

// Many-to-Many: SubKegiatan <-> SumberAnggaran through SubKegiatanSumberAnggaran
SubKegiatan.belongsToMany(SumberAnggaran, {
  through: SubKegiatanSumberAnggaran,
  foreignKey: 'id_sub_kegiatan',
  otherKey: 'id_sumber_anggaran',
  as: 'sumberAnggaranList',
});

SumberAnggaran.belongsToMany(SubKegiatan, {
  through: SubKegiatanSumberAnggaran,
  foreignKey: 'id_sumber_anggaran',
  otherKey: 'id_sub_kegiatan',
  as: 'subKegiatanList',
});

// Direct associations for junction table
SubKegiatanSumberAnggaran.belongsTo(SubKegiatan, {
  foreignKey: 'id_sub_kegiatan',
  as: 'subKegiatan',
});

SubKegiatanSumberAnggaran.belongsTo(SumberAnggaran, {
  foreignKey: 'id_sumber_anggaran',
  as: 'sumberAnggaran',
});

SubKegiatan.hasMany(SubKegiatanSumberAnggaran, {
  foreignKey: 'id_sub_kegiatan',
  as: 'sumberAnggaran',
});

SumberAnggaran.hasMany(SubKegiatanSumberAnggaran, {
  foreignKey: 'id_sumber_anggaran',
  as: 'subKegiatanLinks',
});

// AnggaranKas associations
AnggaranKas.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'puskesmas',
});

AnggaranKas.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

AnggaranKas.belongsTo(SubKegiatan, {
  foreignKey: 'id_sub_kegiatan',
  as: 'subKegiatan',
});

AnggaranKas.belongsTo(SumberAnggaran, {
  foreignKey: 'id_sumber_anggaran',
  as: 'sumberAnggaran',
});

User.hasMany(AnggaranKas, {
  foreignKey: 'user_id',
  as: 'anggaranKas',
});

SubKegiatan.hasMany(AnggaranKas, {
  foreignKey: 'id_sub_kegiatan',
  as: 'anggaranKas',
});

SumberAnggaran.hasMany(AnggaranKas, {
  foreignKey: 'id_sumber_anggaran',
  as: 'anggaranKas',
});

// LraUploadBatch associations
LraUploadBatch.hasMany(LraRealisasi, { foreignKey: 'batch_id', as: 'rows' });
LraRealisasi.belongsTo(LraUploadBatch, { foreignKey: 'batch_id', as: 'batch' });

LraUploadBatch.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });
User.hasMany(LraUploadBatch, { foreignKey: 'uploaded_by', as: 'lraBatches' });

LraRealisasi.belongsTo(User, { foreignKey: 'user_id', as: 'puskesmas' });
LraRealisasi.belongsTo(SubKegiatan, { foreignKey: 'id_sub_kegiatan', as: 'subKegiatan' });
LraRealisasi.belongsTo(SumberAnggaran, { foreignKey: 'id_sumber_anggaran', as: 'sumberAnggaran' });

export {
  User,
  Laporan,
  SumberAnggaran,
  Satuan,
  Kegiatan,
  SubKegiatan,
  PuskesmasSubKegiatan,
  SubKegiatanSumberAnggaran,
  SubKegiatanTarget,
  AnggaranKas,
  LraUploadBatch,
  LraRealisasi,
  sequelize,
  PuskesmasEditPermission,
};
