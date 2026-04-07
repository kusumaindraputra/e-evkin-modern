require("dotenv").config({ path: "./backend/.env" });
const raw = require("./backend/dist/config/database.js");
const seq = raw.default || raw.sequelize || raw;

async function check() {
  const [users] = await seq.query("SELECT id, nama, username FROM users WHERE username LIKE '%bojonggede%' OR nama LIKE '%Bojong%Gede%'");
  console.log("USERS:", JSON.stringify(users));
  if (!users.length) { console.log("No user found"); process.exit(0); }
  const userId = users[0].id;

  const [subs] = await seq.query("SELECT id_sub_kegiatan, kode_sub FROM sub_kegiatan WHERE kode_sub = '1.02.02.2.02.0033'");
  console.log("SUBS:", JSON.stringify(subs));
  if (!subs.length) { console.log("Sub not found"); process.exit(0); }
  const subId = subs[0].id_sub_kegiatan;

  const [targets] = await seq.query(`SELECT id, id_sumber_anggaran, target_k, target_rp FROM sub_kegiatan_targets WHERE user_id = '${userId}' AND id_sub_kegiatan = ${subId} AND tahun = 2026`);
  console.log("TARGETS (count=" + targets.length + "):", JSON.stringify(targets));

  const [angkas] = await seq.query(`SELECT id, id_sumber_anggaran, bulan, nilai FROM angkas_kas WHERE user_id = '${userId}' AND id_sub_kegiatan = ${subId} AND tahun = 2026 ORDER BY id_sumber_anggaran, bulan LIMIT 30`);
  console.log("ANGKAS_KAS (count=" + angkas.length + "):", JSON.stringify(angkas));

  console.log("\nisManualAngkas would be:", targets.length > 1);
  console.log("angkasFullMap would have data:", angkas.length > 0);

  await seq.close();
}
check().catch(e => { console.error(e.message); process.exit(1); });
