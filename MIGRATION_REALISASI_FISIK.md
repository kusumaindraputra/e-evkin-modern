# Kolom Realisasi Fisik - Instruksi Update Database

Fitur kolom "Realisasi Fisik" telah ditambahkan ke laporan kinerja puskesmas. Berikut adalah instruksi untuk update database di server.

## Langkah-langkah:

### 1. Pastikan Backend Berjalan
```bash
cd /var/www/e-evkin/backend
pm2 stop all
```

### 2. Jalankan Migration
Ada dua cara untuk menambahkan kolom ke database:

#### Opsi A: Menggunakan SQL langsung (Recommended)
```bash
psql -h localhost -U postgres -d db_evkin -c "
ALTER TABLE laporan 
ADD COLUMN realisasi_fisik DECIMAL(5,2) NOT NULL DEFAULT 0;
"
```

#### Opsi B: Menggunakan Sequelize CLI (jika sudah setup)
```bash
cd /var/www/e-evkin/backend
npx sequelize-cli db:migrate
```

### 3. Verifikasi Kolom Ditambahkan
```bash
psql -h localhost -U postgres -d db_evkin -c "
\d+ laporan
"
```
Pastikan kolom `realisasi_fisik` muncul dengan tipe `numeric(5,2)` dan default value `0`.

### 4. Restart Backend
```bash
pm2 start ecosystem.config.js
pm2 status
```

### 5. Test di Frontend
- Buka aplikasi dan buat laporan baru
- Field "Realisasi Fisik (%)" seharusnya muncul di form
- Nilai harus 0-100% dengan 2 desimal

## Catatan:
- Kolom `realisasi_fisik` adalah DECIMAL(5,2) untuk mendukung persentase hingga 100.00%
- Default value adalah 0
- Validasi di backend: min 0, max 100
- Di frontend, input dibatasi max 100 dengan `step={0.01}`

## Jika Ada Error:
Jika kolom sudah ada, lanjutkan ke step 4. PostgreSQL akan melewatkan perubahan yang sudah ada.
