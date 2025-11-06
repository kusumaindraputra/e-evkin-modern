# 🗄️ E-EVKIN Modern - Database Setup Guide

## ✅ **Konsistensi Database Name**

Semua konfigurasi sudah disamakan menggunakan: **`e_evkin_modern`**

### **File yang Sudah Disinkronkan:**
- ✅ `backend/.env` → `DB_NAME=e_evkin_modern`
- ✅ `backend/.env.example` → `DB_NAME=e_evkin_modern`
- ✅ `backend/.env.staging` → `DB_NAME=e_evkin_staging`
- ✅ `backend/src/config/index.ts` → default `e_evkin_modern`
- ✅ `backend/src/config/database.ts` → menggunakan config
- ✅ `backend/src/__tests__/setup.ts` → `e_evkin_modern`

## 🚀 **Quick Setup**

### **1. Create Database (Choose One):**

#### **Option A: Windows Batch Script**
```cmd
npm run create-db
```

#### **Option B: Manual via pgAdmin/psql**
```sql
CREATE DATABASE e_evkin_modern;
```

#### **Option C: Command Line**
```cmd
createdb -U postgres e_evkin_modern
```

### **2. Run Seeder:**
```bash
cd backend
npm run seed
```

## 🔧 **Troubleshooting**

### **Error: "database does not exist"**
- Make sure database `e_evkin_modern` exists
- Check PostgreSQL is running
- Verify credentials in `.env` file

### **Error: "authentication failed"**
- Check username/password in `.env`
- Default: `postgres/admin`

### **Error: "connection refused"**
- PostgreSQL service not running
- Check port 5432 is available

## 📋 **Environment Variables**

### **Development (.env):**
```env
DB_NAME=e_evkin_modern
DB_USER=postgres
DB_PASSWORD=admin
```

### **Staging (.env.staging):**
```env
DB_NAME=e_evkin_staging
DB_USER=evkin_user
DB_PASSWORD=secure_password
```

### **Production (.env.production):**
```env
DB_NAME=e_evkin_production
DB_USER=evkin_user
DB_PASSWORD=very_secure_password
```

## ✅ **Verification**

After setup, verify with:
```bash
# Test connection
cd backend
npm run test:db  # if available

# Or run seeder
npm run seed
```

Should see:
```
✅ Database connected successfully
✅ Database synced
✅ Seeding completed
```

---

**Database Name**: `e_evkin_modern`  
**Status**: ✅ All configs synchronized  
**Updated**: November 6, 2025