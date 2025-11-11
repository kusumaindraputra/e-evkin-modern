import User from './User';
import Laporan from './Laporan';
import SumberAnggaran from './SumberAnggaran';
import Satuan from './Satuan';
import Kegiatan from './Kegiatan';
import SubKegiatan from './SubKegiatan';
import PuskesmasSubKegiatan from './PuskesmasSubKegiatan';
import SubKegiatanSumberAnggaran from './SubKegiatanSumberAnggaran';

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

export { 
  User, 
  Laporan, 
  SumberAnggaran, 
  Satuan, 
  Kegiatan, 
  SubKegiatan, 
  PuskesmasSubKegiatan,
  SubKegiatanSumberAnggaran,
};
