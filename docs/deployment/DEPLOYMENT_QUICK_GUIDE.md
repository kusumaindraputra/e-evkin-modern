# 🚀 E-EVKIN Modern - Quick Deployment Guide (Ubuntu 24 + aaPanel)

## 📋 Ringkasan Optimisasi untuk Server 2GB RAM

Semua konfigurasi deployment telah dioptimalkan untuk server staging Anda:

### ✅ **Optimisasi yang Sudah Diterapkan:**

1. **PM2 Configuration** (`ecosystem.config.js`)
   - Fork mode (lebih efisien untuk single instance)
   - Memory restart pada 800MB (aman untuk 2GB server)
   - Optimized timeouts dan process management

2. **Nginx Configuration** (`nginx.conf`)
   - Path diubah ke `/www/wwwroot/` (sesuai aaPanel)
   - Optimized untuk 2GB RAM
   - Reduced cache untuk staging
   - Proxy buffering optimized

3. **Deploy Script** (`deploy.sh`)
   - Path directory updated untuk aaPanel
   - Memory-aware dependency installation
   - Enhanced error handling dan health checks

4. **Environment** (`.env.staging`)
   - Node.js memory limit 1024MB
   - Optimized database user
   - Performance tuning options

5. **Server Optimization Script** (`optimize-server.sh`)
   - Automatic swap file creation
   - PostgreSQL tuning untuk 2GB RAM
   - System-level optimizations
   - Log rotation setup

## 📁 **Lokasi Clone Repository: PENTING!**

### ✅ **RECOMMENDED (aaPanel Compatible):**
```bash
/www/wwwroot/e-evkin-modern/
```

### ❌ **JANGAN gunakan:**
```bash
/var/www/e-evkin-modern/  # Conflict dengan aaPanel
/home/user/e-evkin-modern/  # Permission issues
/root/e-evkin-modern/  # Security risk
```

### **Mengapa `/www/wwwroot/`?**
- ✅ Default path aaPanel
- ✅ Proper web server permissions (www-data)
- ✅ Compatible dengan aaPanel file manager
- ✅ Nginx DocumentRoot expectations
- ✅ Backup system integration

## 🔧 **Deployment Commands Sequence**

### 1. **Clone Repository:**
```bash
cd /www/wwwroot/
git clone https://github.com/kusumaindraputra/e-evkin-modern.git
cd e-evkin-modern/
```

### 2. **Set Permissions:**
```bash
sudo chown -R www-data:www-data /www/wwwroot/e-evkin-modern/
chmod +x deploy.sh optimize-server.sh
```

### 3. **Server Optimization (Run Once):**
```bash
sudo ./optimize-server.sh
```

### 4. **Configure Environment:**
```bash
cp backend/.env.staging backend/.env
nano backend/.env  # Edit credentials
```

### 5. **Deploy Application:**
```bash
./deploy.sh
```

## 🔍 **Pre-Deployment Checklist**

### **Server Requirements:**
- [ ] Ubuntu 24.04 LTS
- [ ] aaPanel installed dan running
- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed
- [ ] PM2 installed globally
- [ ] Git installed
- [ ] 2GB RAM + swap file

### **Configuration Files:**
- [ ] `backend/.env` dikonfigurasi dengan credentials
- [ ] Database user dan database dibuat
- [ ] Nginx site dikonfigurasi via aaPanel
- [ ] Firewall ports dibuka (80, 443, 8888)

### **Permissions:**
- [ ] Repository owner: `www-data:www-data`
- [ ] Scripts executable: `chmod +x *.sh`
- [ ] Directory: `/www/wwwroot/e-evkin-modern/`

## 📊 **Memory Usage Expected:**

```
Component               Memory Usage
======================================
Node.js Backend         ~300-500MB
PostgreSQL              ~200-300MB
Nginx                   ~50-100MB
System                  ~500-800MB
Available Buffer        ~400-950MB
======================================
Total Usage             ~1.0-1.7GB
Safe Threshold          <1.8GB
```

## 🚨 **Critical Notes untuk 2GB Server:**

### **DO:**
- ✅ Monitor memory dengan `free -h`
- ✅ Use PM2 fork mode (not cluster)
- ✅ Enable swap file (1GB recommended)
- ✅ Use `--skip-deps` untuk quick deployments
- ✅ Monitor PM2 logs: `pm2 logs`

### **DON'T:**
- ❌ Run multiple Node.js instances
- ❌ Use cluster mode di PM2
- ❌ Skip memory optimization
- ❌ Ignore OOM warnings
- ❌ Use development mode di production

## 🛠️ **Quick Commands Reference:**

```bash
# Deploy application
./deploy.sh

# Quick update (skip dependencies)
./deploy.sh --skip-deps

# Check status
pm2 status
pm2 logs e-evkin-backend

# Monitor server
/usr/local/bin/e-evkin-monitor  # After optimization

# Restart if needed
pm2 restart e-evkin-backend

# Check memory
free -h
htop
```

## 🔗 **Default Credentials (CHANGE AFTER DEPLOYMENT!):**

**Admin:**
- Username: `dinkes`
- Password: `dinkes123`

**Puskesmas:**
- Username: `cibinong`
- Password: `bogorkab`

## 📞 **Support & Troubleshooting:**

Jika ada masalah:
1. Check `DEPLOYMENT_UBUNTU_AAPANEL.md` untuk panduan lengkap
2. Run `/usr/local/bin/e-evkin-monitor` untuk status
3. Check PM2 logs: `pm2 logs e-evkin-backend`
4. Verify health: `curl http://localhost:5000/health`

---

**Optimized for:** Ubuntu 24 + aaPanel + 2GB RAM  
**Updated:** November 6, 2025  
**Ready to Deploy:** ✅ YES