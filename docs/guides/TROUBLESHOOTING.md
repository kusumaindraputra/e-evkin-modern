# Deployment Troubleshooting Guide

## 🔧 Common Errors & Solutions

### 1. npm: command not found

#### Error Message
```bash
./backend/deploy-backend.sh: line 75: npm: command not found
```

#### Cause
Node.js dan npm belum terinstall di server.

#### Solution

##### Ubuntu/Debian
```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

##### CentOS/RHEL
```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify
node --version
npm --version
```

##### Using NVM (Recommended untuk development)
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js
nvm install 18
nvm use 18

# Verify
node --version
npm --version
```

##### Manual Download
Visit: https://nodejs.org/en/download/

---

### 2. Permission Denied

#### Error Message
```bash
bash: ./deploy-backend.sh: Permission denied
```

#### Solution
```bash
# Make script executable
chmod +x backend/deploy-backend.sh
chmod +x backend/run-backend.sh
chmod +x frontend/deploy-frontend.sh
chmod +x frontend/run-frontend.sh

# Or use git
git add --chmod=+x backend/deploy-backend.sh
```

---

### 3. Database Connection Error

#### Error Message
```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```

#### Solution

##### Check PostgreSQL Status
```bash
sudo systemctl status postgresql
```

##### Start PostgreSQL
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

##### Check Database Exists
```bash
sudo -u postgres psql

# In psql:
\l                              # List databases
\du                             # List users
\q                              # Quit
```

##### Create Database
```bash
sudo -u postgres psql

CREATE DATABASE e_evkin_modern;
CREATE USER admin_evkin WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE e_evkin_modern TO admin_evkin;
\q
```

##### Update .env
```properties
DB_HOST=localhost
DB_PORT=5432
DB_NAME=e_evkin_modern
DB_USER=admin_evkin
DB_PASSWORD=your_password
```

---

### 4. CORS Error

#### Error Message
```
Access to XMLHttpRequest blocked by CORS policy
```

#### Solution

##### Backend .env
```properties
# Must match frontend URL exactly
CORS_ORIGIN=https://your-frontend-domain.com

# Multiple origins (comma-separated)
CORS_ORIGIN=https://domain1.com,https://domain2.com

# For development
CORS_ORIGIN=http://localhost:5173
```

##### Restart Backend
```bash
pm2 restart e-evkin-backend
```

---

### 5. Port Already in Use

#### Error Message
```bash
Error: listen EADDRINUSE: address already in use :::5000
```

#### Solution

##### Find Process
```bash
# Linux/Mac
lsof -i :5000

# Or
netstat -tulpn | grep 5000
```

##### Kill Process
```bash
kill -9 <PID>
```

##### Or Change Port
```properties
# .env
PORT=5001
```

---

### 6. JWT Secret Error

#### Error Message
```bash
Error: secretOrPrivateKey must have a value
```

#### Solution

##### Generate JWT_SECRET
```bash
# Method 1: Auto-generate
cd backend
./deploy-backend.sh

# Method 2: Manual
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

##### Update .env
```properties
JWT_SECRET=<generated-secret-here>
```

---

### 7. Build Failed - TypeScript Errors

#### Error Message
```bash
error TS2304: Cannot find name 'xxx'
```

#### Solution

##### Clean Install
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
npm run build

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

##### Check Node Version
```bash
node --version  # Should be 18+
```

---

### 8. Cannot Connect to Frontend

#### Error Message
```bash
Failed to fetch
```

#### Solution

##### Check Backend Running
```bash
curl http://localhost:5000/api/health
```

##### Check Frontend .env
```properties
# Must point to backend API
VITE_API_URL=http://localhost:5000/api

# Or production
VITE_API_URL=https://api.yourdomain.com/api
```

##### Rebuild Frontend
```bash
cd frontend
./deploy-frontend.sh
```

---

### 9. Nginx 404 on Refresh

#### Error Message
```
404 Not Found (on page refresh)
```

#### Solution

##### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/e-evkin-frontend;
    index index.html;
    
    # SPA - must have this!
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

##### Test & Reload
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

### 10. PM2 Not Found

#### Error Message
```bash
pm2: command not found
```

#### Solution

##### Install PM2
```bash
# Global install
sudo npm install -g pm2

# Verify
pm2 --version
```

##### Setup PM2 Startup
```bash
pm2 startup
# Follow the instructions

pm2 save
```

---

### 11. Seed Failed - Table Already Exists

#### Error Message
```bash
Error: relation "users" already exists
```

#### Solution

##### Check Warning
⚠️ Seed script uses `force: true` which **DROPS ALL TABLES**

##### Only Run Once
```bash
# First deployment
npm run seed

# Updates - DON'T run seed
./deploy-backend.sh
```

##### Reset Database
```bash
# If you really need to reset
sudo -u postgres psql

DROP DATABASE e_evkin_modern;
CREATE DATABASE e_evkin_modern;
GRANT ALL PRIVILEGES ON DATABASE e_evkin_modern TO admin_evkin;
\q

# Then seed
npm run seed
```

---

### 12. Git Clone Failed

#### Error Message
```bash
Permission denied (publickey)
```

#### Solution

##### HTTPS Clone
```bash
git clone https://github.com/kusumaindraputra/e-evkin-modern.git
```

##### SSH Setup
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub
cat ~/.ssh/id_ed25519.pub
# Copy and add to GitHub Settings -> SSH Keys
```

---

### 13. Frontend Build Too Large

#### Warning Message
```bash
Some chunks are larger than 500 KiB
```

#### Solution

##### Not a Critical Error
This is just a warning. Build will still work.

##### Optimize (Optional)
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'antd': ['antd'],
        }
      }
    }
  }
});
```

---

### 14. Backend Crashes on Start

#### Error Message
```bash
[PM2] App crashed
```

#### Solution

##### Check Logs
```bash
pm2 logs e-evkin-backend

# Or
tail -f backend/logs/err.log
```

##### Common Issues
1. Database not running
2. Wrong .env configuration
3. Missing dependencies
4. Port already in use

##### Debug Mode
```bash
# Run without PM2 to see errors
cd backend
node dist/server.js
```

---

### 15. Cannot Access from External IP

#### Error Message
```bash
Connection refused from external IP
```

#### Solution

##### Check Firewall
```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 5000  # Backend
sudo ufw allow 80    # Frontend
sudo ufw allow 443   # HTTPS

# CentOS/RHEL
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload
```

##### Check Nginx Listening
```bash
sudo netstat -tulpn | grep nginx
```

##### Update Backend Binding
```typescript
// backend/src/server.ts
app.listen(PORT, '0.0.0.0', () => {  // Listen on all interfaces
  console.log(`Server running on port ${PORT}`);
});
```

---

## 🔍 Diagnostic Commands

### System Check
```bash
# Node.js & npm
node --version
npm --version

# PostgreSQL
sudo systemctl status postgresql
psql --version

# Nginx
sudo systemctl status nginx
nginx -v

# PM2
pm2 --version
pm2 list
```

### Port Check
```bash
# Check what's running on port
lsof -i :5000
lsof -i :80

# Or
netstat -tulpn | grep 5000
```

### Database Check
```bash
# Connect to database
psql -U admin_evkin -d e_evkin_modern -h localhost

# Check tables
\dt

# Check users
SELECT * FROM users LIMIT 5;
```

### Log Check
```bash
# Backend logs
pm2 logs e-evkin-backend
tail -f backend/logs/err.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System logs
journalctl -xe
```

---

## 📞 Getting Help

### Check Documentation
1. **DEPLOYMENT_SEPARATE.md** - Deployment guide
2. **DEPLOYMENT_SCRIPTS_GUIDE.md** - Scripts reference
3. **DATABASE_SEED.md** - Seeding guide
4. **JWT_SECRET_GUIDE.md** - JWT configuration

### Verify Installation
```bash
# Run health check script
./health-check.sh
```

### Debug Mode
```bash
# Backend
cd backend
NODE_ENV=development npm run dev

# Frontend
cd frontend
npm run dev
```

---

## ✅ Deployment Checklist

Before deploying, verify:

- [ ] Node.js 18+ installed
- [ ] npm installed
- [ ] PostgreSQL installed and running
- [ ] Database created
- [ ] .env files configured (backend & frontend)
- [ ] Firewall ports open (5000, 80, 443)
- [ ] PM2 installed (for production)
- [ ] Nginx installed (for frontend)
- [ ] Scripts are executable (chmod +x)

---

**Last Updated**: November 2025
