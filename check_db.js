require('dotenv').config({ path: './backend/.env.production' });
const seq = require("./backend/dist/config/database").default;
async function run() {
  await seq.authenticate();
  console.log("Connected!");
  const [subs] = await seq.query("SELECT id_sub_kegiatan, id_kegiatan, kode_sub, kegiatan FROM sub_kegiatan ORDER BY kode_sub");
  console.log("SUB_KEGIATAN count:", subs.length);
  subs.forEach(s => console.log(s.id_sub_kegiatan + " | keg=" + s.id_kegiatan + " | " + s.kode_sub + " | " + s.kegiatan.substring(0,60)));
  const [kegs] = await seq.query("SELECT * FROM kegiatan ORDER BY kode");
  console.log("\nKEGIATAN count:", kegs.length);
  kegs.forEach(k => console.log(k.id_kegiatan + " | " + k.kode + " | " + k.kegiatan.substring(0,60)));
  await seq.close();
}
run().catch(console.error);
