# 🔧 E-EVKIN Modern - Scripts Directory

Collection of utility scripts for E-EVKIN Modern deployment and maintenance.

## 📁 Available Scripts

### 🚀 **Deployment & Setup**
- **`setup-database.sh/.ps1`** - Setup database (Linux/Windows)
- **`create-database.sql`** - SQL script to create database
- **`create-database.bat`** - Windows batch script for database creation
- **`backup.sh`** - Create backup of application data
- **`optimize-server.sh`** - Optimize server for 2GB RAM (Ubuntu + aaPanel)
- **`generate-jwt-secret.sh`** - Generate secure JWT secret
- **`make-executable.sh`** - Make all scripts executable via git

### 🔍 **Monitoring & Health**
- **`health-check.sh`** - Check application health status

## 📋 Usage

### Database Setup (First Time):
```bash
# Windows
./scripts/create-database.bat

# Or manually in psql/pgAdmin
CREATE DATABASE e_evkin_modern;
```
### Make Scripts Executable:
```bash
./scripts/make-executable.sh
git commit -m "Make scripts executable"
```

### Server Optimization (First Time Setup):
```bash
sudo ./scripts/optimize-server.sh
```

### Create Backup:
```bash
./scripts/backup.sh
```

### Generate JWT Secret:
```bash
./scripts/generate-jwt-secret.sh
```

### Health Check:
```bash
./scripts/health-check.sh
```

## 🔗 NPM Script Shortcuts

You can also run these scripts via npm:

```bash
npm run make-executable    # ./scripts/make-executable.sh
npm run backup            # ./scripts/backup.sh
npm run health-check      # ./scripts/health-check.sh
npm run optimize-server   # sudo ./scripts/optimize-server.sh
npm run generate-jwt      # ./scripts/generate-jwt-secret.sh
```

## ⚠️ Important Notes

### **Root Access Required:**
- `optimize-server.sh` - Requires sudo access for system optimization

### **Environment Specific:**
- `optimize-server.sh` - Designed for Ubuntu 24 + aaPanel with 2GB RAM
- `backup.sh` - Uses aaPanel directory structure (`/www/wwwroot/`)

### **Git Integration:**
- `make-executable.sh` - Uses git to set executable permissions
- Run this after cloning repository or adding new scripts

## 🔄 Script Dependencies

```
make-executable.sh → Sets permissions for all other scripts
optimize-server.sh → Should be run after server setup
backup.sh → Can be run anytime after deployment
health-check.sh → Can be run anytime after deployment
generate-jwt-secret.sh → Run during initial setup
```

## 📚 Related Documentation

- **Main Deployment**: `../deploy.sh`
- **Deployment Guides**: `../docs/deployment/`
- **Server Setup**: `../docs/deployment/DEPLOYMENT_UBUNTU_AAPANEL.md`
- **Quick Start**: `../QUICK_START.md`

---

**Location**: `/scripts/`  
**Count**: 5 utility scripts  
**Platform**: Ubuntu 24 + aaPanel  
**Updated**: November 6, 2025