# E-EVKIN Modern - Complete Deployment Guide

## 🚀 Streamlined Deployment Process

The deployment has been simplified to **ONE SINGLE SCRIPT** that handles everything from initial setup to regular updates.

## 📋 Deployment Script Overview

### `deploy.sh` - The Only Script You Need

This comprehensive script handles:
- ✅ **First-time setup** (system dependencies, database, nginx)
- ✅ **Regular deployments** (code updates, builds, restarts)
- ✅ **Memory optimization** for 2GB servers
- ✅ **Database setup and seeding**
- ✅ **Nginx configuration**
- ✅ **PM2 process management**
- ✅ **Health checks and validation**

## 🎯 Usage Commands

### First-Time Deployment (Fresh Server)
```bash
# Complete initial setup - installs everything
chmod +x deploy.sh
bash deploy.sh --first-time
```

### Regular Deployment (Updates)
```bash
# Normal deployment - updates code and rebuilds
bash deploy.sh
```

### Quick Deployment (Skip Dependencies)
```bash
# Fast deployment - skips dependency installation
bash deploy.sh --quick
```

## 📂 File Structure After Cleanup

### ✅ Essential Files Kept:
- `deploy.sh` - **Main deployment script** (handles everything)
- `backend/deploy-backend.sh` - Backend-specific operations
- `frontend/deploy-frontend.sh` - Frontend-specific operations
- `ecosystem.config.js` - PM2 configuration

### ❌ Removed Redundant Files:
- `deploy-low-memory.sh` *(integrated into deploy.sh)*
- `deploy-aapanel.sh` *(integrated into deploy.sh)*
- `setup-manual-nginx.sh` *(integrated into deploy.sh)*
- `setup-aapanel-nginx.sh` *(integrated into deploy.sh)*
- `install-nginx-aapanel.sh` *(integrated into deploy.sh)*
- `fix-aapanel-nginx.sh` *(integrated into deploy.sh)*
- `setup-production-env.sh` *(integrated into deploy.sh)*
- `setup-database.sh` *(integrated into deploy.sh)*
- `test-deployment.sh` *(integrated into deploy.sh)*

## 🎉 Complete Deployment Process

### Step 1: First-Time Setup
```bash
# On aaPanel Ubuntu server as root:
cd /www/wwwroot/e-evkin-modern
chmod +x deploy.sh
bash deploy.sh --first-time
```

**This will automatically:**
1. Install Node.js 18, PM2, Nginx, PostgreSQL
2. Create database and user
3. Set up environment variables
4. Install all dependencies
5. Build backend and frontend
6. Seed database with initial data
7. Configure nginx with site settings
8. Start backend with PM2
9. Perform health checks
10. Display access URLs and credentials

### Step 2: Regular Updates
```bash
# For code updates:
bash deploy.sh
```

**This will:**
1. Pull latest code from git
2. Install updated dependencies
3. Rebuild applications
4. Restart backend process
5. Reload nginx
6. Verify health checks

### Step 3: Quick Updates (No Dependencies)
```bash
# For quick code-only updates:
bash deploy.sh --quick
```

## 🌐 Access Information

After successful deployment:

### 🔗 URLs:
- **Website:** http://103.197.189.168
- **API:** http://103.197.189.168/api/
- **Health Check:** http://103.197.189.168/health

### 🔐 Login Credentials:
- **Admin:** `dinkes` / `dinkes123`
- **Puskesmas:** `cibinong` / `bogorkab`

## 📊 Monitoring Commands

```bash
# PM2 process status
pm2 status

# Backend logs
pm2 logs e-evkin-backend

# Nginx status
systemctl status nginx

# Database status
systemctl status postgresql

# Health check
curl http://103.197.189.168/health

# Quick test
curl -I http://103.197.189.168
```

## 🔧 Technical Details

### Memory Optimization:
- Node.js heap limit: 1024MB (fallback to 768MB)
- PM2 memory restart: 1500MB
- Optimized dependency installation
- Efficient build processes

### Security Features:
- JWT authentication
- CORS protection
- Security headers (X-Frame-Options, X-XSS-Protection, etc.)
- Environment variable protection
- Sensitive file access blocking

### Performance Features:
- Gzip compression
- Static asset caching (30 days)
- HTML no-cache for updates
- Optimized proxy settings
- Connection pooling

## 🏗️ Architecture

```
Client (Browser)
    ↓
Nginx (Port 80) → Static Files (React SPA)
    ↓
Reverse Proxy (/api/) → Backend (Node.js, Port 5000)
    ↓
PostgreSQL Database
```

## 🆘 Troubleshooting

### If deployment fails:
1. Check logs: `tail -f /www/wwwroot/e-evkin-modern/deploy.log`
2. Check PM2: `pm2 logs e-evkin-backend`
3. Check Nginx: `nginx -t`
4. Check database: `systemctl status postgresql`

### Common issues:
- **Memory errors:** Automatically handled with fallback limits
- **Port conflicts:** Script uses standard ports (80, 5000, 5432)
- **Permission errors:** Script requires root access on aaPanel
- **Database connection:** Automatically creates database and user

## ✨ Benefits of Streamlined Approach

1. **Single Command:** One script handles everything
2. **Idempotent:** Safe to run multiple times
3. **Memory-Optimized:** Works on 2GB servers
4. **Error Handling:** Comprehensive error checking
5. **Rollback Safe:** PM2 process management
6. **Production Ready:** Security and performance optimized
7. **Self-Documenting:** Clear output and logging

## 🎊 Success!

Your E-EVKIN Modern application is now deployed with a single, reliable script that handles all deployment scenarios. No more managing multiple scripts or complex setup procedures!

**One script. Complete deployment. Production ready.** 🚀