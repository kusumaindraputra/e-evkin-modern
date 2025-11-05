import { sequelize } from '../config/database';
import User from '../models/User';
import Laporan from '../models/Laporan';

async function seed() {
  try {
    await sequelize.sync({ force: true }); // This will drop and recreate tables
    console.log('✅ Database synced');

    // Seed Admin User
    await User.create({
      username: 'dinkes',
      password: 'dinkes',
      nama: 'Administrator Dinkes',
      role: 'admin',
    });
    console.log('✅ Admin user created (username: dinkes, password: dinkes)');

    // Seed Puskesmas data (102 puskesmas dari Bogor)
    const puskesmasData = [
      { nama: 'Bojonggede', username: 'bojonggede', kecamatan: 'Bojonggede', wilayah: 'Parung', id_blud: 'BLUD' },
      { nama: 'Bagoang', username: 'bagoang', kecamatan: 'Jasinga', wilayah: 'Jasinga', id_blud: 'JKN' },
      { nama: 'Jasinga', username: 'jasinga', kecamatan: 'Jasinga', wilayah: 'Jasinga', id_blud: 'BLUD' },
      { nama: 'Curug', username: 'curug', kecamatan: 'Jasinga', wilayah: 'Jasinga', id_blud: 'JKN' },
      { nama: 'Cigudeg', username: 'cigudeg', kecamatan: 'Cigudeg', wilayah: 'Jasinga', id_blud: 'BLUD' },
      { nama: 'Lebakwangi', username: 'lebakwangi', kecamatan: 'Cigudeg', wilayah: 'Jasinga', id_blud: 'JKN' },
      { nama: 'Bunar', username: 'bunar', kecamatan: 'Cigudeg', wilayah: 'Jasinga', id_blud: 'JKN' },
      { nama: 'Sukajaya', username: 'sukajaya', kecamatan: 'Sukajaya', wilayah: 'Jasinga', id_blud: 'BLUD' },
      { nama: 'Kiara Pandak', username: 'kiarapandak', kecamatan: 'Sukajaya', wilayah: 'Jasinga', id_blud: 'JKN' },
      { nama: 'Parung Panjang', username: 'parungpanjang', kecamatan: 'Parung Panjang', wilayah: 'Jasinga', id_blud: 'BLUD' },
      { nama: 'Dago', username: 'dago', kecamatan: 'Parung Panjang', wilayah: 'Jasinga', id_blud: 'JKN' },
      { nama: 'Tenjo', username: 'tenjo', kecamatan: 'Tenjo', wilayah: 'Jasinga', id_blud: 'BLUD' },
      { nama: 'Pasar Rebo', username: 'pasarrebo', kecamatan: 'Tenjo', wilayah: 'Jasinga', id_blud: 'JKN' },
      { nama: 'Nanggung', username: 'nanggung', kecamatan: 'Nanggung', wilayah: 'Jasinga', id_blud: 'BLUD' },
      { nama: 'Curug Bitung', username: 'curugbitung', kecamatan: 'Nanggung', wilayah: 'Jasinga', id_blud: 'JKN' },
      { nama: 'Leuwiliang', username: 'leuwiliang', kecamatan: 'Leuwiliang', wilayah: 'Leuwiliang', id_blud: 'BLUD' },
      { nama: 'Puraseda', username: 'puraseda', kecamatan: 'Leuwiliang', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Leuwisadeng', username: 'leuwisadeng', kecamatan: 'Leuwisadeng', wilayah: 'Leuwiliang', id_blud: 'BLUD' },
      { nama: 'Sadeng Pasar', username: 'sadengpasar', kecamatan: 'Leuwisadeng', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Rumpin', username: 'rumpin', kecamatan: 'Rumpin', wilayah: 'Leuwiliang', id_blud: 'BLUD' },
      { nama: 'Gobang', username: 'gobang', kecamatan: 'Rumpin', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Cicangkal', username: 'cicangkal', kecamatan: 'Rumpin', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Cibungbulang', username: 'cibungbulang', kecamatan: 'Cibungbulang', wilayah: 'Leuwiliang', id_blud: 'BLUD' },
      { nama: 'Cijujung', username: 'cijujung', kecamatan: 'Cibungbulang', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Situ Udik', username: 'situudik', kecamatan: 'Cibungbulang', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Pamijahan', username: 'pamijahan', kecamatan: 'Pamijahan', wilayah: 'Leuwiliang', id_blud: 'BLUD' },
      { nama: 'Ciasmara', username: 'ciasmara', kecamatan: 'Pamijahan', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Cibening', username: 'cibening', kecamatan: 'Pamijahan', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Ciampea', username: 'ciampea', kecamatan: 'Ciampea', wilayah: 'Leuwiliang', id_blud: 'BLUD' },
      { nama: 'Ciampea Udik', username: 'ciampeaudik', kecamatan: 'Ciampea', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Pasir', username: 'pasir', kecamatan: 'Ciampea', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Cihideung Udik', username: 'cihideungudik', kecamatan: 'Ciampea', wilayah: 'Leuwiliang', id_blud: 'JKN' },
      { nama: 'Tenjolaya', username: 'tenjolaya', kecamatan: 'Tenjolaya', wilayah: 'Leuwiliang', id_blud: 'BLUD' },
      { nama: 'Ciomas', username: 'ciomas', kecamatan: 'Ciomas', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Ciapus', username: 'ciapus', kecamatan: 'Ciomas', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Laladon', username: 'laladon', kecamatan: 'Ciomas', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Kota Batu', username: 'kotabatu', kecamatan: 'Ciomas', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Dramaga', username: 'dramaga', kecamatan: 'Tenjolaya', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Kampung Manggis', username: 'kampungmanggis', kecamatan: 'Tenjolaya', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Purwasari', username: 'purwasari', kecamatan: 'Tenjolaya', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Cangkurawok', username: 'cangkurawok', kecamatan: 'Tenjolaya', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Sirnagalih', username: 'sirnagalih', kecamatan: 'Tamansari', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Tamansari', username: 'tamansari', kecamatan: 'Tamansari', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Sukaresmi', username: 'sukaresmi', kecamatan: 'Tamansari', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Ciawi', username: 'ciawi', kecamatan: 'Ciawi', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Banjarsari', username: 'banjarsari', kecamatan: 'Ciawi', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Citapen', username: 'citapen', kecamatan: 'Ciawi', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Cisarua', username: 'cisarua', kecamatan: 'Cisarua', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Cibulan', username: 'cibulan', kecamatan: 'Cisarua', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Megamendung', username: 'megamendung', kecamatan: 'Megamendung', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Sukamanah', username: 'sukamanah', kecamatan: 'Megamendung', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Caringin', username: 'caringin', kecamatan: 'Caringin', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Ciderum', username: 'ciderum', kecamatan: 'Caringin', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Cinagara', username: 'cinagara', kecamatan: 'Caringin', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Cijeruk', username: 'cijeruk', kecamatan: 'Cijeruk', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Sukaharja', username: 'sukaharja', kecamatan: 'Cijeruk', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Cigombong', username: 'cigombong', kecamatan: 'Cigombong', wilayah: 'Ciawi', id_blud: 'BLUD' },
      { nama: 'Ciburayut', username: 'ciburayut', kecamatan: 'Cigombong', wilayah: 'Ciawi', id_blud: 'JKN' },
      { nama: 'Parung', username: 'parung', kecamatan: 'Parung', wilayah: 'Parung', id_blud: 'BLUD' },
      { nama: 'Cogreg', username: 'cogreg', kecamatan: 'Parung', wilayah: 'Parung', id_blud: 'JKN' },
      { nama: 'Gunung Sindur', username: 'gunungsindur', kecamatan: 'Gunung Sindur', wilayah: 'Parung', id_blud: 'BLUD' },
      { nama: 'Suliwer', username: 'suliwer', kecamatan: 'Gunung Sindur', wilayah: 'Parung', id_blud: 'JKN' },
      { nama: 'Kemang', username: 'kemang', kecamatan: 'Kemang', wilayah: 'Parung', id_blud: 'BLUD' },
      { nama: 'Jampang', username: 'jampang', kecamatan: 'Kemang', wilayah: 'Parung', id_blud: 'JKN' },
      { nama: 'Tajurhalang', username: 'tajurhalang', kecamatan: 'Tajurhalang', wilayah: 'Parung', id_blud: 'BLUD' },
      { nama: 'Kemuning', username: 'kemuning', kecamatan: 'Bojonggede', wilayah: 'Parung', id_blud: 'JKN' },
      { nama: 'Ragajaya', username: 'ragajaya', kecamatan: 'Bojonggede', wilayah: 'Parung', id_blud: 'JKN' },
      { nama: 'Ciseeng', username: 'ciseeng', kecamatan: 'Ciseeng', wilayah: 'Parung', id_blud: 'BLUD' },
      { nama: 'Cibeuteung Udik', username: 'cibeuteungudik', kecamatan: 'Ciseeng', wilayah: 'Parung', id_blud: 'JKN' },
      { nama: 'Bantarjaya', username: 'bantarjaya', kecamatan: 'Rancabungur', wilayah: 'Parung', id_blud: 'BLUD' },
      { nama: 'Rancabungur', username: 'rancabungur', kecamatan: 'Rancabungur', wilayah: 'Parung', id_blud: 'JKN' },
      { nama: 'Cirimekar', username: 'cirimekar', kecamatan: 'Cibinong', wilayah: 'Cibinong', id_blud: 'BLUD' },
      { nama: 'Cibinong', username: 'cibinong', kecamatan: 'Cibinong', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Karadenan', username: 'karadenan', kecamatan: 'Cibinong', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Pabuaran Indah', username: 'pabuaranindah', kecamatan: 'Cibinong', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Gunung Putri', username: 'gunungputri', kecamatan: 'Gunung Putri', wilayah: 'Cibinong', id_blud: 'BLUD' },
      { nama: 'Ciangsana', username: 'ciangsana', kecamatan: 'Gunung Putri', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Karanggan', username: 'karanggan', kecamatan: 'Gunung Putri', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Bojong Nangka', username: 'bojongnangka', kecamatan: 'Gunung Putri', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Cimandala', username: 'cimandala', kecamatan: 'Sukaraja', wilayah: 'Cibinong', id_blud: 'BLUD' },
      { nama: 'Sukaraja', username: 'sukaraja', kecamatan: 'Sukaraja', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Cilebut', username: 'cilebut', kecamatan: 'Sukaraja', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Babakan Madang', username: 'babakanmadang', kecamatan: 'Babakan Madang', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Sentul', username: 'sentul', kecamatan: 'Babakan Madang', wilayah: 'Cibinong', id_blud: 'BLUD' },
      { nama: 'Cijayanti', username: 'cijayanti', kecamatan: 'Babakan Madang', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Citeureup', username: 'citeureup', kecamatan: 'Citeureup', wilayah: 'Cibinong', id_blud: 'BLUD' },
      { nama: 'Leuwinutug', username: 'leuwinutug', kecamatan: 'Citeureup', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Tajur', username: 'tajur', kecamatan: 'Citeureup', wilayah: 'Cibinong', id_blud: 'JKN' },
      { nama: 'Jonggol', username: 'jonggol', kecamatan: 'Jonggol', wilayah: 'Jonggol', id_blud: 'BLUD' },
      { nama: 'Sukanegara', username: 'sukanegara', kecamatan: 'Jonggol', wilayah: 'Jonggol', id_blud: 'JKN' },
      { nama: 'Balekambang', username: 'balekambang', kecamatan: 'Jonggol', wilayah: 'Jonggol', id_blud: 'JKN' },
      { nama: 'Cileungsi', username: 'cileungsi', kecamatan: 'Cileungsi', wilayah: 'Jonggol', id_blud: 'BLUD' },
      { nama: 'Pasir Angin', username: 'pasirangin', kecamatan: 'Cileungsi', wilayah: 'Jonggol', id_blud: 'JKN' },
      { nama: 'Gandoang', username: 'gandoang', kecamatan: 'Cileungsi', wilayah: 'Jonggol', id_blud: 'JKN' },
      { nama: 'Sukamakmur', username: 'sukamakmur', kecamatan: 'Sukamakmur', wilayah: 'Jonggol', id_blud: 'BLUD' },
      { nama: 'Sukadamai', username: 'sukadamai', kecamatan: 'Sukamakmur', wilayah: 'Jonggol', id_blud: 'JKN' },
      { nama: 'Klapanunggal', username: 'klapanunggal', kecamatan: 'Klapanunggal', wilayah: 'Jonggol', id_blud: 'BLUD' },
      { nama: 'Bojong', username: 'bojong', kecamatan: 'Klapanunggal', wilayah: 'Jonggol', id_blud: 'JKN' },
      { nama: 'Cariu', username: 'cariu', kecamatan: 'Cariu', wilayah: 'Jonggol', id_blud: 'BLUD' },
      { nama: 'Karyamekar', username: 'karyamekar', kecamatan: 'Cariu', wilayah: 'Jonggol', id_blud: 'JKN' },
      { nama: 'Tanjungsari', username: 'tanjungsari', kecamatan: 'Tanjungsari', wilayah: 'Jonggol', id_blud: 'BLUD' },
      { nama: 'Labkesda', username: 'labkesda', kecamatan: '', wilayah: '', id_blud: '' },
    ];

    for (const puskesmas of puskesmasData) {
      await User.create({
        username: puskesmas.username,
        password: 'bogorkab', // Default password untuk semua puskesmas
        nama: puskesmas.nama,
        nama_puskesmas: puskesmas.nama,
        role: 'puskesmas',
        id_blud: puskesmas.id_blud,
        kecamatan: puskesmas.kecamatan,
        wilayah: puskesmas.wilayah,
      });
    }
    console.log(`✅ ${puskesmasData.length} Puskesmas users created`);

    // Seed sample Laporan data untuk 5 puskesmas pertama
    const users = await User.findAll({ 
      where: { role: 'puskesmas' },
      limit: 5,
      raw: true
    });

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus'];
    
    for (const user of users) {
      for (const month of months) {
        await Laporan.create({
          user_id: user.id,
          id_kegiatan: 2,
          id_sub_kegiatan: 30,
          sumber_anggaran: 'APBD',
          satuan: 'Kegiatan',
          target_k: 12,
          angkas: 1000000000,
          target_rp: 1500000000,
          realisasi_k: Math.floor(Math.random() * 10) + 1,
          realisasi_rp: Math.floor(Math.random() * 800000000) + 200000000,
          permasalahan: `Permasalahan sample bulan ${month}`,
          upaya: `Upaya penyelesaian untuk bulan ${month}`,
          bulan: month,
          tahun: '2022',
        });
      }
    }
    console.log(`✅ Sample laporan data created for ${users.length} puskesmas`);

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\nCredentials:');
    console.log('Admin - username: dinkes, password: dinkes');
    console.log('Puskesmas - username: bojonggede (or any from list), password: bogorkab');
    console.log(`\nTotal: 1 Admin + ${puskesmasData.length} Puskesmas + ${users.length * months.length} Laporan`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
