/**
 * Script to update existing users with kode_sub_unit values
 * Run: npx tsx src/seeders/updateKodeSubUnit.ts
 */

import { sequelize } from '../config/database';
import User from '../models/User';

// Mapping from puskesmas name to kode_sub_unit
const kodeSubUnitMapping: Record<string, string> = {
  "Jasinga": "1.02.0.00.0.00.01.0010",
  "Cibungbulang": "1.02.0.00.0.00.01.0011",
  "Leuwiliang": "1.02.0.00.0.00.01.0012",
  "Nanggung": "1.02.0.00.0.00.01.0013",
  "Ciampea": "1.02.0.00.0.00.01.0014",
  "Ciawi": "1.02.0.00.0.00.01.0015",
  "Cigombong": "1.02.0.00.0.00.01.0016",
  "Cijeruk": "1.02.0.00.0.00.01.0017",
  "Bojonggede": "1.02.0.00.0.00.01.0018",
  "Parung": "1.02.0.00.0.00.01.0019",
  "Sirnagalih": "1.02.0.00.0.00.01.0020",
  "Tajurhalang": "1.02.0.00.0.00.01.0021",
  "Cigudeg": "1.02.0.00.0.00.01.0022",
  "Cimandala": "1.02.0.00.0.00.01.0023",
  "Cirimekar": "1.02.0.00.0.00.01.0024",
  "Citeureup": "1.02.0.00.0.00.01.0025",
  "Jonggol": "1.02.0.00.0.00.01.0026",
  "Sentul": "1.02.0.00.0.00.01.0027",
  "Tanjungsari": "1.02.0.00.0.00.01.0028",
  "Bantarjaya": "1.02.0.00.0.00.01.0029",
  "Tenjo": "1.02.0.00.0.00.01.0030",
  "Sukajaya": "1.02.0.00.0.00.01.0031",
  "Parung Panjang": "1.02.0.00.0.00.01.0032",
  "Tenjolaya": "1.02.0.00.0.00.01.0033",
  "Rumpin": "1.02.0.00.0.00.01.0034",
  "Pamijahan": "1.02.0.00.0.00.01.0035",
  "Leuwisadeng": "1.02.0.00.0.00.01.0036",
  "Dramaga": "1.02.0.00.0.00.01.0037",
  "Ciomas": "1.02.0.00.0.00.01.0038",
  "Caringin": "1.02.0.00.0.00.01.0039",
  "Cisarua": "1.02.0.00.0.00.01.0040",
  "Megamendung": "1.02.0.00.0.00.01.0041",
  "Gunung Sindur": "1.02.0.00.0.00.01.0042",
  "Ciseeng": "1.02.0.00.0.00.01.0043",
  "Kemang": "1.02.0.00.0.00.01.0044",
  "Gunung Putri": "1.02.0.00.0.00.01.0045",
  "Cileungsi": "1.02.0.00.0.00.01.0046",
  "Sukamakmur": "1.02.0.00.0.00.01.0047",
  "Cariu": "1.02.0.00.0.00.01.0048",
  "Klapanunggal": "1.02.0.00.0.00.01.0049",
  "Labkesda": "1.02.0.00.0.00.01.0113",
  "Bagoang": "1.02.0.00.0.00.01.0052",
  "Curug": "1.02.0.00.0.00.01.0053",
  "Lebakwangi": "1.02.0.00.0.00.01.0054",
  "Bunar": "1.02.0.00.0.00.01.0055",
  "Kiara Pandak": "1.02.0.00.0.00.01.0056",
  "Dago": "1.02.0.00.0.00.01.0057",
  "Pasar Rebo": "1.02.0.00.0.00.01.0058",
  "Curug Bitung": "1.02.0.00.0.00.01.0059",
  "Puraseda": "1.02.0.00.0.00.01.0060",
  "Sadeng Pasar": "1.02.0.00.0.00.01.0061",
  "Gobang": "1.02.0.00.0.00.01.0062",
  "Cicangkal": "1.02.0.00.0.00.01.0063",
  "Cijujung": "1.02.0.00.0.00.01.0064",
  "Situ Udik": "1.02.0.00.0.00.01.0065",
  "Ciasmara": "1.02.0.00.0.00.01.0066",
  "Cibening": "1.02.0.00.0.00.01.0067",
  "Ciampea Udik": "1.02.0.00.0.00.01.0068",
  "Pasir": "1.02.0.00.0.00.01.0069",
  "Cihideung Udik": "1.02.0.00.0.00.01.0070",
  "Laladon": "1.02.0.00.0.00.01.0071",
  "Ciapus": "1.02.0.00.0.00.01.0072",
  "Kota Batu": "1.02.0.00.0.00.01.0073",
  "Tamansari": "1.02.0.00.0.00.01.0074",
  "Sukaresmi": "1.02.0.00.0.00.01.0075",
  "Kampung Manggis": "1.02.0.00.0.00.01.0076",
  "Purwasari": "1.02.0.00.0.00.01.0077",
  "Cangkurawok": "1.02.0.00.0.00.01.0078",
  "Cibulan": "1.02.0.00.0.00.01.0079",
  "Sukamanah": "1.02.0.00.0.00.01.0080",
  "Banjarsari": "1.02.0.00.0.00.01.0081",
  "Citapen": "1.02.0.00.0.00.01.0082",
  "Ciderum": "1.02.0.00.0.00.01.0083",
  "Cinagara": "1.02.0.00.0.00.01.0084",
  "Ciburayut": "1.02.0.00.0.00.01.0085",
  "Sukaharja": "1.02.0.00.0.00.01.0086",
  "Jampang": "1.02.0.00.0.00.01.0087",
  "Rancabungur": "1.02.0.00.0.00.01.0088",
  "Cogreg": "1.02.0.00.0.00.01.0089",
  "Cibeuteung Udik": "1.02.0.00.0.00.01.0090",
  "Suliwer": "1.02.0.00.0.00.01.0091",
  "Kemuning": "1.02.0.00.0.00.01.0092",
  "Ragajaya": "1.02.0.00.0.00.01.0093",
  "Cibinong": "1.02.0.00.0.00.01.0094",
  "Pabuaran Indah": "1.02.0.00.0.00.01.0095",
  "Karadenan": "1.02.0.00.0.00.01.0096",
  "Sukaraja": "1.02.0.00.0.00.01.0097",
  "Cilebut": "1.02.0.00.0.00.01.0098",
  "Leuwinutug": "1.02.0.00.0.00.01.0099",
  "Tajur": "1.02.0.00.0.00.01.0100",
  "Babakan Madang": "1.02.0.00.0.00.01.0101",
  "Cijayanti": "1.02.0.00.0.00.01.0102",
  "Bojong Nangka": "1.02.0.00.0.00.01.0103",
  "Ciangsana": "1.02.0.00.0.00.01.0104",
  "Karanggan": "1.02.0.00.0.00.01.0105",
  "Pasir Angin": "1.02.0.00.0.00.01.0106",
  "Gandoang": "1.02.0.00.0.00.01.0107",
  "Bojong": "1.02.0.00.0.00.01.0108",
  "Sukanegara": "1.02.0.00.0.00.01.0109",
  "Balekambang": "1.02.0.00.0.00.01.0110",
  "Sukadamai": "1.02.0.00.0.00.01.0111",
  "Karyamekar": "1.02.0.00.0.00.01.0112"
};

async function updateKodeSubUnit() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Get all puskesmas users
    const users = await User.findAll({
      where: { role: 'puskesmas' },
    });

    console.log(`Found ${users.length} puskesmas users`);

    let updated = 0;
    let notFound = 0;
    const notFoundList: string[] = [];

    for (const user of users) {
      const nama = user.nama || user.nama_puskesmas;
      if (!nama) {
        notFound++;
        continue;
      }
      const kode = kodeSubUnitMapping[nama];

      if (kode) {
        await user.update({ kode_sub_unit: kode });
        updated++;
        console.log(`✅ Updated ${nama} with kode_sub_unit: ${kode}`);
      } else {
        notFound++;
        notFoundList.push(nama);
        console.log(`⚠️ No mapping found for: ${nama}`);
      }
    }

    console.log('\n===========================================');
    console.log('SUMMARY');
    console.log('===========================================');
    console.log(`Total puskesmas users: ${users.length}`);
    console.log(`Updated with kode_sub_unit: ${updated}`);
    console.log(`Not found in mapping: ${notFound}`);
    
    if (notFoundList.length > 0) {
      console.log('\nPuskesmas without kode_sub_unit:');
      notFoundList.forEach(n => console.log(`  - ${n}`));
    }

    await sequelize.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error updating kode_sub_unit:', error);
    process.exit(1);
  }
}

updateKodeSubUnit();
