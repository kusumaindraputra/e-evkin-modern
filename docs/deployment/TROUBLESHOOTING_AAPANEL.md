# 🔧 E-EVKIN Modern - Deployment Troubleshooting Guide

## ❌ "This script should not be run as root" Error

### **Solusi 1: Gunakan Script aaPanel-Optimized**
```bash
# Gunakan script yang sudah dioptimasi untuk aaPanel
./deploy-aapanel.sh --production
```

### **Solusi 2: Run dengan Konfirmasi (Original Script)**
```bash
# Script original sekarang akan menampilkan warning dan meminta konfirmasi
./deploy.sh --production
# Ketik 'y' ketika diminta konfirmasi
```

### **Solusi 3: Fix Permissions Dulu**
```bash
# Jalankan script fix permission terlebih dahulu
./fix-permissions.sh

# Kemudian coba deployment lagi
./deploy.sh --production
```

## 🔧 **Common aaPanel Deployment Issues**

### **1. Permission Denied Errors**
```bash
# Fix all permissions
./fix-permissions.sh

# Check current user
whoami
id

# If needed, run as www user
su - www -c './deploy-aapanel.sh --production'
```

### **2. Node.js/NPM Not Found**
```bash
# Install via aaPanel Package Manager
# Go to aaPanel → App Store → Node.js → Install

# Or check PATH
echo $PATH
which node
which npm

# Add to PATH if needed
export PATH="/usr/local/bin:$PATH"
```

### **3. PM2 Issues**
```bash
# Install PM2 globally
npm install -g pm2

# If permission errors
./fix-permissions.sh

# Check PM2 status
pm2 list
pm2 logs
```

### **4. Git Pull Fails**
```bash
# If git not available, manually upload files via aaPanel File Manager
# Or install git
apt update && apt install git

# Fix git permissions
cd /www/wwwroot/e-evkin-modern
git config --global --add safe.directory $(pwd)
```

### **5. Build Failures**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf backend/node_modules frontend/node_modules
rm -rf backend/package-lock.json frontend/package-lock.json

# Run deployment again
./deploy-aapanel.sh --production
```

### **6. Port 5000 Already in Use**
```bash
# Check what's using port 5000
netstat -tulpn | grep :5000
lsof -i :5000

# Kill process if needed
pm2 stop all
pm2 kill

# Or change port in .env
echo "PORT=5001" >> backend/.env
```

### **7. Database Connection Issues**
```bash
# Check PostgreSQL status
systemctl status postgresql

# Check database exists
sudo -u postgres psql -l | grep evkin

# Test connection
cd backend
node -e "
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});
pool.connect().then(() => console.log('✅ DB connected')).catch(err => console.log('❌ DB error:', err));
"
```

## 🚀 **Recommended Deployment Flow for aaPanel**

### **Step 1: Preparation**
```bash
# 1. Upload files via aaPanel File Manager to /www/wwwroot/e-evkin-modern
# 2. Install Node.js via aaPanel Package Manager
# 3. Install PostgreSQL via aaPanel Database

# 4. SSH into server and navigate to app directory
cd /www/wwwroot/e-evkin-modern

# 5. Fix permissions
./fix-permissions.sh
```

### **Step 2: Environment Setup**
```bash
# Setup production environment
./setup-production-env.sh

# Verify environment
cd backend && node verify-env.js
```

### **Step 3: Deploy**
```bash
# Use aaPanel-optimized script
./deploy-aapanel.sh --production

# Or original script (will ask for root confirmation)
./deploy.sh --production
```

### **Step 4: Verification**
```bash
# Check backend
curl http://localhost:5000/health

# Check PM2
pm2 list
pm2 logs e-evkin-backend

# Check frontend via browser
# Visit your domain
```

## 📋 **aaPanel-Specific Notes**

### **File Manager Upload:**
- Use aaPanel File Manager to upload project files
- Extract to `/www/wwwroot/e-evkin-modern`
- Ensure all files are properly uploaded

### **Domain Configuration:**
- Add domain in aaPanel → Website
- Set document root to `/www/wwwroot/e-evkin-modern/frontend/dist`
- Configure reverse proxy for `/api` to `http://localhost:5000`

### **SSL Certificate:**
- Use aaPanel → SSL → Let's Encrypt for free SSL
- Enable "Force HTTPS" option

### **Database Management:**
- Use aaPanel → Database to manage PostgreSQL
- Create database and user via aaPanel interface
- Note down credentials for .env file

## 🆘 **Emergency Recovery**

### **If Deployment Completely Fails:**
```bash
# 1. Stop all processes
pm2 kill

# 2. Clear everything
rm -rf backend/dist frontend/dist backend/node_modules frontend/node_modules

# 3. Fix permissions
./fix-permissions.sh

# 4. Manual step-by-step
cd backend
npm install
npx tsc
cd ../frontend
npm install
npm run build
cd ..

# 5. Start manually
cd backend
pm2 start dist/server.js --name e-evkin-backend
pm2 save
```

### **Rollback to Previous Version:**
```bash
# If backup exists
cd /www/wwwroot/e-evkin-modern/backups
ls -la
# Restore from latest backup
```

## 📞 **Getting Help**

### **Check Logs:**
```bash
# Application logs
pm2 logs e-evkin-backend

# System logs  
tail -f /var/log/nginx/error.log
tail -f /var/log/postgresql/postgresql-*.log

# aaPanel logs
tail -f /www/server/panel/logs/error.log
```

### **Health Checks:**
```bash
# Backend health
curl http://localhost:5000/health

# Database connection
cd backend && node -e "require('./src/config/database').authenticate().then(() => console.log('DB OK')).catch(console.error)"

# PM2 status
pm2 monit
```

---

**Last Updated:** January 2025  
**Environment:** Ubuntu 24.04 + aaPanel + 2GB RAM  
**Scripts:** deploy-aapanel.sh, fix-permissions.sh, setup-production-env.sh