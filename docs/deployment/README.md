# E-EVKIN Modern - Deployment Documentation

## 📋 Deployment Files Overview

Dokumentasi deployment telah dibersihkan dan diorganisir. Berikut panduan yang tersedia:

### 🎯 **REKOMENDASI: Gunakan panduan ini untuk deployment**

**[DEPLOYMENT_UBUNTU_AAPANEL.md](DEPLOYMENT_UBUNTU_AAPANEL.md)**
- **Tujuan:** Deployment utama untuk Ubuntu 24.04 + aaPanel + 2GB RAM
- **Target Server:** VPS dengan aaPanel interface
- **Fitur:** Step-by-step lengkap dengan optimasi memory
- **Status:** ✅ Updated dan tested

### 📚 Dokumentasi Pendukung

1. **[DEPLOYMENT_QUICK_GUIDE.md](DEPLOYMENT_QUICK_GUIDE.md)**
   - Panduan cepat dan ringkasan optimasi
   - Memory usage expectations
   - Do's and Don'ts untuk server 2GB RAM

2. **[PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md)**
   - Checklist lengkap sebelum deployment
   - Validasi semua komponen
   - Testing dan monitoring setup

3. **[DEPLOYMENT.md](DEPLOYMENT.md)**
   - Alternative deployment method
   - Untuk setup manual tanpa aaPanel

## 🚀 Quick Start

1. **Persiapan Server:**
   - Ubuntu 24.04 dengan aaPanel terinstall
   - Minimal 2GB RAM (optimized untuk ini)
   - Node.js 18+, PostgreSQL 14+

2. **Ikuti Panduan Utama:**
   ```bash
   # Baca dan ikuti langkah-langkah di:
   cat docs/deployment/DEPLOYMENT_UBUNTU_AAPANEL.md
   ```

3. **Verifikasi dengan Checklist:**
   ```bash
   # Pastikan semua item di checklist selesai:
   cat docs/deployment/PRE_DEPLOYMENT_CHECKLIST.md
   ```

## 🎯 Path Standar aaPanel

```
/www/wwwroot/[domain]/
├── backend/           # Node.js application
├── frontend/dist/     # Built React app
└── uploads/          # File uploads (if any)
```

## 📞 Support

Jika ada masalah saat deployment:
1. Cek [DEPLOYMENT_QUICK_GUIDE.md](DEPLOYMENT_QUICK_GUIDE.md) untuk troubleshooting
2. Verifikasi [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md)
3. Gunakan script health-check.sh untuk diagnosis

---

**Updated:** January 2025
**Target:** Ubuntu 24.04 + aaPanel + 2GB RAM