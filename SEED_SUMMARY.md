# Database Seed - Summary

## ✅ File Created & Updated

### New Files
1. **DATABASE_SEED.md** - Comprehensive seeding documentation
2. **SEED_SUMMARY.md** - This file (quick reference)

### Updated Files
1. **backend/src/seeders/seed.ts** - Complete database seeder
2. **backend/package.json** - Added `"seed": "tsx src/seeders/seed.ts"` script
3. **DEPLOYMENT.md** - Added seeding step in deployment workflow

## 📦 Seed File Contents

### Master Data
- ✅ 20 Satuan (Orang, Kegiatan, Dokumen, dll.)
- ✅ 4 Sumber Anggaran (BLUD, DAK, APBD, JKN)
- ✅ 3 Kegiatan dengan id_uraian dan kode
- ✅ 7 Sub Kegiatan dengan indikator kinerja

### Users
- ✅ 1 Admin (dinkes/dinkes123) - bcrypt hashed
- ✅ 102 Puskesmas (bogorkab password) - bcrypt hashed
  - Complete data: nama, kecamatan, wilayah, id_blud
  - Covers all 102 puskesmas in Kabupaten Bogor

### Sample Data
- ✅ Laporan for 5 puskesmas
- ✅ 8 months (Januari - Agustus 2025)
- ✅ 2-3 reports per puskesmas per month
- ✅ Randomized realistic data

## 🚀 How to Use

### First Time Setup
```bash
cd backend
npm run seed
```

### During Deployment
```bash
cd /var/www/e-evkin-modern/backend
npm run build
npm run seed    # ← Only on first deployment!
pm2 start ../ecosystem.config.js
```

### For Updates (DON'T run seed)
```bash
./deploy.sh     # This script does NOT include seed
```

## 🔐 Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | dinkes | dinkes123 |
| Puskesmas | cibinong | bogorkab |
| Puskesmas | bojonggede | bogorkab |
| Puskesmas | jasinga | bogorkab |
| ... | (102 total) | bogorkab |

## ⚠️ Important Warnings

### 🔴 Data Destruction
- Script uses `sequelize.sync({ force: true })`
- **DROPS ALL EXISTING TABLES**
- **RECREATES TABLES FROM SCRATCH**
- **ALL DATA WILL BE LOST**

### 🔴 When NOT to Run
- ❌ On production with existing data
- ❌ During normal updates/deployments
- ❌ After users have changed default passwords
- ❌ When laporan data already exists

### 🟢 When to Run
- ✅ Fresh server setup
- ✅ Development environment reset
- ✅ Testing environment initialization
- ✅ Demo/staging first deployment

## 📊 Expected Results

### Database Tables Count
```
Satuan:          20 rows
Sumber Anggaran:  4 rows
Kegiatan:         3 rows
Sub Kegiatan:     7 rows
Users:          103 rows (1 admin + 102 puskesmas)
Laporan:      ~100 rows (sample data)
```

### Verification Queries
```sql
-- Check all tables
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

## 🛠️ Troubleshooting

### Database Connection Error
```bash
# Check .env file
cat backend/.env

# Should have:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=e_evkin_staging
DB_USER=evkin_user
DB_PASSWORD=your_password
```

### bcrypt Module Error
```bash
cd backend
npm install
```

### Permission Denied
```bash
# Grant privileges
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE e_evkin_staging TO evkin_user;
\q
```

## 🔗 Related Documentation

- [DATABASE_SEED.md](./DATABASE_SEED.md) - Full seeding guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment workflow
- [README.md](./README.md) - Project overview
- [QUICK_START.md](./QUICK_START.md) - Quick start guide

## 📝 Notes

1. **Password Security**: All passwords are bcrypt hashed (10 salt rounds)
2. **Data Integrity**: Use foreign keys properly (kegiatan → sub_kegiatan)
3. **Sample Data**: Only 5 puskesmas have laporan (for demo purposes)
4. **Year 2025**: Sample laporan uses year 2025
5. **Deployment**: Seed command integrated in DEPLOYMENT.md

## ✨ Next Steps After Seeding

1. ✅ Verify database connection: `psql -U evkin_user -d e_evkin_staging`
2. ✅ Check table counts (see verification queries above)
3. ✅ Login as admin: http://your-domain.com/login
4. ✅ Test admin features:
   - Master Data management
   - Konfigurasi Sub Kegiatan
   - Daftar Puskesmas
5. ✅ Login as puskesmas: cibinong / bogorkab
6. ✅ Test puskesmas features:
   - Laporan Kinerja
   - Cara Pengisian
7. ✅ Change default passwords for security
8. ✅ Backup database: `npm run backup`

## 🎉 Completion Checklist

- [x] Seed file created (backend/src/seeders/seed.ts)
- [x] npm script added (package.json)
- [x] Documentation created (DATABASE_SEED.md)
- [x] Deployment guide updated (DEPLOYMENT.md)
- [x] bcrypt password hashing implemented
- [x] Master data complete (Satuan, Sumber Anggaran, Kegiatan, Sub Kegiatan)
- [x] Admin user created
- [x] 102 Puskesmas users created
- [x] Sample laporan data generated
- [x] No TypeScript errors
- [x] Ready for production deployment

---

**Status**: ✅ **READY FOR DEPLOYMENT**

Last updated: 2025
