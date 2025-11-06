# E-EVKIN Modern - Database Seeding Guide

## Overview
File seed database untuk inisialisasi data awal sistem E-EVKIN Modern. File ini akan membuat struktur database lengkap dengan data master dan user default.

## Lokasi File
```
backend/src/seeders/seed.ts
```

## Cara Menjalankan

### 1. Development (Lokal)
```bash
cd backend
npm run seed
```

### 2. Production (Server)
```bash
cd /var/www/e-evkin-modern/backend
npm run seed
```

### 3. Manual dengan tsx
```bash
cd backend
npx tsx src/seeders/seed.ts
```

## Data yang di-Seed

### 1. Master Data - Satuan (20 items)
```
- Orang
- Kegiatan
- Dokumen
- Paket
- Kali
- Unit
- Bulan
- Tahun
- Hari
- Jam
- Lembar
- Set
- Kelas
- Kelompok
- Desa
- Posyandu
- Puskesmas
- Laporan
- Kasus
- Sampel
```

### 2. Master Data - Sumber Anggaran (4 items)
```
- BLUD Puskesmas
- DAK Non Fisik
- APBD Kabupaten
- JKN
```

### 3. Master Data - Kegiatan (3 items)
```
1. 1.02.01 - Peningkatan Kapasitas SDM Kesehatan
2. 1.02.02 - Penyelenggaraan Pelayanan Kesehatan Masyarakat
3. 1.02.03 - Pembinaan dan Pengawasan Upaya Kesehatan
```

### 4. Master Data - Sub Kegiatan (7 items)
```
1. 1.02.01.01 - Pelatihan Tenaga Kesehatan Puskesmas
2. 1.02.01.02 - Sosialisasi Program Kesehatan
3. 1.02.02.01 - Pelayanan Kesehatan Ibu dan Anak
4. 1.02.02.02 - Pelayanan Imunisasi Dasar
5. 1.02.02.03 - Pelayanan Gizi Masyarakat
6. 1.02.03.01 - Monitoring dan Evaluasi Program Kesehatan
7. 1.02.03.02 - Pembinaan Posyandu
```

### 5. User - Admin (1 user)
```
Username: dinkes
Password: dinkes123 (bcrypt hashed)
Nama: Administrator Dinkes
Role: admin
```

### 6. User - Puskesmas (102 users)
```
Username: cibinong, bojonggede, jasinga, cigudeg, dll.
Password: bogorkab (bcrypt hashed - sama untuk semua)
Role: puskesmas
```

Daftar lengkap 102 puskesmas dari Kabupaten Bogor dengan data:
- nama (nama puskesmas)
- nama_puskesmas
- kecamatan
- wilayah (Parung, Jasinga, Leuwiliang, Ciawi, Cibinong, Jonggol)
- id_blud (BLUD/JKN)

### 7. Sample Laporan Data
```
- 5 puskesmas pertama
- 8 bulan (Januari - Agustus 2025)
- 2-3 laporan per puskesmas per bulan
- Random sub kegiatan, sumber anggaran, satuan
- Data target dan realisasi yang realistis
```

## Kredensial Default

### Admin
```
URL: http://your-domain.com/login
Username: dinkes
Password: dinkes123
```

### Puskesmas (Contoh)
```
URL: http://your-domain.com/login
Username: cibinong
Password: bogorkab

Username: bojonggede
Password: bogorkab

Username: jasinga
Password: bogorkab

... dan 99 puskesmas lainnya
```

## Catatan Penting

### ⚠️ Data akan Dihapus
Script seed menggunakan `sequelize.sync({ force: true })` yang akan:
- **DROP semua tabel yang ada**
- **RECREATE tabel baru**
- **INSERT data seed**

**Jangan jalankan di production jika sudah ada data!**

### 🔒 Password Security
- Admin password: `dinkes123` (harus diganti setelah login pertama)
- Puskesmas password: `bogorkab` (harus diganti oleh masing-masing puskesmas)
- Semua password di-hash menggunakan bcrypt (10 salt rounds)

### 📊 Sample Laporan
Sample laporan yang di-seed:
- **Periode**: Januari - Agustus 2025
- **Tahun**: 2025
- **Puskesmas**: 5 puskesmas pertama (Bojonggede, Bagoang, Jasinga, Curug, Cigudeg)
- **Jumlah**: ~80-120 laporan (2-3 per puskesmas per bulan)

### 🗄️ Database Requirements
```
Database: e_evkin_modern (dev) / e_evkin_staging (staging) / e_evkin_production (prod)
User: evkin_user
Password: [sesuai .env]
```

## Troubleshooting

### Error: "Database does not exist"
```bash
# Login ke PostgreSQL
sudo -u postgres psql

# Buat database
CREATE DATABASE e_evkin_staging;
CREATE USER evkin_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE e_evkin_staging TO evkin_user;
\q
```

### Error: "Cannot find module 'bcrypt'"
```bash
cd backend
npm install
```

### Error: "Connection refused"
Cek konfigurasi database di `.env`:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=e_evkin_staging
DB_USER=evkin_user
DB_PASSWORD=your_password
```

### Warning: Data akan Hilang
Jika tidak ingin kehilangan data yang ada, jangan jalankan seed. Atau:
1. Backup database terlebih dahulu: `npm run backup`
2. Atau ubah `force: true` menjadi `force: false` di file seed.ts

## Integrasi dengan Deployment

### First Deployment
```bash
cd /var/www/e-evkin-modern/backend
npm run build
npm run seed  # ← Jalankan seed untuk data awal
pm2 start ../ecosystem.config.js
```

### Update Deployment (JANGAN jalankan seed)
```bash
cd /var/www/e-evkin-modern
./deploy.sh  # Script deploy TIDAK include seed
```

## Modifikasi Data Seed

Untuk menambah/mengubah data seed, edit file:
```
backend/src/seeders/seed.ts
```

Contoh menambah satuan baru:
```typescript
const satuanData = [
  { satuannya: 'Orang' },
  { satuannya: 'Kegiatan' },
  // ... existing data
  { satuannya: 'Item Baru' },  // ← Tambah disini
];
```

Contoh menambah user admin baru:
```typescript
// Setelah admin pertama
const admin2Password = await bcrypt.hash('password123', 10);
await User.create({
  username: 'admin2',
  password: admin2Password,
  nama: 'Administrator Kedua',
  role: 'admin',
});
```

## Verifikasi Setelah Seed

### Cek via Terminal
```bash
# Login ke database
psql -U evkin_user -d e_evkin_staging

# Cek jumlah data
SELECT 'Satuan' as table_name, count(*) FROM satuan
UNION ALL
SELECT 'Sumber Anggaran', count(*) FROM sumber_anggaran
UNION ALL
SELECT 'Kegiatan', count(*) FROM kegiatan
UNION ALL
SELECT 'Sub Kegiatan', count(*) FROM sub_kegiatan
UNION ALL
SELECT 'Users', count(*) FROM users
UNION ALL
SELECT 'Laporan', count(*) FROM laporan;
```

Expected output:
```
     table_name     | count 
--------------------+-------
 Satuan            |    20
 Sumber Anggaran   |     4
 Kegiatan          |     3
 Sub Kegiatan      |     7
 Users             |   103
 Laporan           |   ~100
```

### Cek via Browser
1. Login sebagai admin: `dinkes / dinkes123`
2. Cek menu Master Data → Satuan (harus ada 20 item)
3. Cek menu Master Data → Sumber Anggaran (harus ada 4 item)
4. Cek menu Konfigurasi Sub Kegiatan (harus ada 7 item dalam 3 kegiatan)
5. Cek menu Daftar Puskesmas (harus ada 102 puskesmas)

## Best Practices

### ✅ DO
- Jalankan seed pada fresh database
- Backup database sebelum seed jika ada data penting
- Ubah password default setelah login pertama
- Test login admin dan puskesmas setelah seed

### ❌ DON'T
- Jangan jalankan seed di production yang sudah ada data
- Jangan commit file .env dengan password asli
- Jangan gunakan password default di production
- Jangan jalankan seed berulang kali tanpa backup

## Support

Jika ada masalah dengan seeding:
1. Cek log output dari `npm run seed`
2. Cek koneksi database di `.env`
3. Pastikan PostgreSQL running: `sudo systemctl status postgresql`
4. Cek permissions database user
