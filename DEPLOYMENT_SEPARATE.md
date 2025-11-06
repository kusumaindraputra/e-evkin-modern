# E-EVKIN Modern - Deployment Terpisah (Frontend & Backend)

## 📋 Overview

Deployment terpisah memungkinkan frontend dan backend di-deploy di server yang berbeda atau direktori yang berbeda.

## 🗂️ Struktur Deployment

```
Production Setup:
├── Backend Server (Port 5000)
│   ├── API Endpoints
│   ├── Database Connection
│   └── Business Logic
│
└── Frontend Server (Port 80/443)
    ├── Static Files (HTML, CSS, JS)
    ├── Nginx/Apache
    └── Calls Backend API
```

## 📦 File Deployment

### Backend
```
backend/
├── deploy-backend.sh    # Build backend
├── run-backend.sh       # Run backend
├── .env                 # Configuration (create from .env.example)
└── .env.example         # Template
```

### Frontend
```
frontend/
├── deploy-frontend.sh   # Build frontend
├── run-frontend.sh      # Run frontend preview
├── .env                 # Configuration (create from .env.example)
└── .env.example         # Template
```

## 🚀 Deployment Steps

### 1. Backend Deployment

#### Persiapan
```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit konfigurasi
nano .env
```

**Update .env dengan nilai yang sesuai:**
```properties
NODE_ENV=production
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=evkin_db
DB_USER=admin_evkin
DB_PASSWORD=YOUR_SECURE_PASSWORD  # ← GANTI INI!

JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY  # ← GANTI INI!
JWT_EXPIRE=7d

CORS_ORIGIN=https://your-frontend-domain.com  # ← GANTI INI!

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Build & Run
```bash
# Build
./deploy-backend.sh

# Seed database (first time only!)
npm run seed

# Run
./run-backend.sh

# Atau dengan PM2 (recommended untuk production)
pm2 start run-backend.sh --name e-evkin-backend
```

#### Verifikasi
```bash
# Test API endpoint
curl http://localhost:5000/api/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

---

### 2. Frontend Deployment

#### Persiapan
```bash
cd frontend

# Copy environment file
cp .env.example .env

# Edit konfigurasi
nano .env
```

**Update .env dengan URL backend:**
```properties
# Development
VITE_API_URL=http://localhost:5000/api

# Production
VITE_API_URL=https://your-backend-domain.com/api
```

#### Build
```bash
# Build
./deploy-frontend.sh

# Output akan ada di folder: dist/
```

#### Deploy ke Nginx
```bash
# Copy build output ke web root
sudo cp -r dist/* /var/www/e-evkin-frontend/

# Atau dengan rsync
sudo rsync -av dist/ /var/www/e-evkin-frontend/
```

#### Konfigurasi Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/e-evkin-frontend;
    index index.html;
    
    # Frontend routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests ke backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Restart Nginx
```bash
sudo nginx -t
sudo systemctl restart nginx
```

#### Verifikasi
```bash
# Test frontend
curl http://your-domain.com

# Should return HTML content
```

---

## 🔧 Make Scripts Executable

### Jika File Belum Executable

#### Method 1: Git (Recommended)
```bash
# Backend
git add --chmod=+x backend/deploy-backend.sh
git add --chmod=+x backend/run-backend.sh

# Frontend
git add --chmod=+x frontend/deploy-frontend.sh
git add --chmod=+x frontend/run-frontend.sh

# Commit
git commit -m "Make deployment scripts executable"
git push
```

#### Method 2: chmod (di Server Linux)
```bash
# Backend
chmod +x backend/deploy-backend.sh
chmod +x backend/run-backend.sh

# Frontend
chmod +x frontend/deploy-frontend.sh
chmod +x frontend/run-frontend.sh
```

---

## 📋 Deployment Scenarios

### Scenario 1: Same Server, Different Ports
```
Backend:  http://server.com:5000/api
Frontend: http://server.com:80
```

**Backend .env:**
```properties
PORT=5000
CORS_ORIGIN=http://server.com
```

**Frontend .env:**
```properties
VITE_API_URL=http://server.com:5000/api
```

---

### Scenario 2: Different Servers
```
Backend:  http://api.example.com/api
Frontend: http://app.example.com
```

**Backend .env:**
```properties
PORT=5000
CORS_ORIGIN=http://app.example.com
```

**Frontend .env:**
```properties
VITE_API_URL=http://api.example.com/api
```

---

### Scenario 3: Subdomain Setup
```
Backend:  http://api.evkin.com/api
Frontend: http://evkin.com
```

**Backend .env:**
```properties
PORT=5000
CORS_ORIGIN=http://evkin.com
```

**Frontend .env:**
```properties
VITE_API_URL=http://api.evkin.com/api
```

---

## 🔄 Update Deployment

### Update Backend
```bash
cd backend

# Pull latest code
git pull

# Rebuild
./deploy-backend.sh

# Restart
pm2 restart e-evkin-backend
```

### Update Frontend
```bash
cd frontend

# Pull latest code
git pull

# Rebuild
./deploy-frontend.sh

# Copy to web root
sudo rsync -av dist/ /var/www/e-evkin-frontend/

# Clear Nginx cache
sudo nginx -s reload
```

---

## 🐛 Troubleshooting

### Backend Issues

**Error: Cannot connect to database**
```bash
# Check database status
sudo systemctl status postgresql

# Check connection
psql -U admin_evkin -d evkin_db -h localhost

# Verify .env configuration
cat backend/.env
```

**Error: Port already in use**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change PORT in .env
```

---

### Frontend Issues

**Error: Failed to fetch API**
```bash
# Check backend is running
curl http://localhost:5000/api/health

# Check CORS configuration
# Backend CORS_ORIGIN must match frontend domain

# Check browser console for errors
```

**Error: 404 on page refresh**
```bash
# Nginx must have try_files directive
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## 📊 Monitoring

### Check Backend Status
```bash
# With PM2
pm2 status
pm2 logs e-evkin-backend

# Manual
ps aux | grep node
netstat -tulpn | grep 5000
```

### Check Frontend Status
```bash
# Nginx status
sudo systemctl status nginx

# Check logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔒 Security Checklist

### Backend
- [ ] Change DB_PASSWORD dari default
- [ ] Generate strong JWT_SECRET
- [ ] Set proper CORS_ORIGIN
- [ ] Enable HTTPS
- [ ] Configure firewall (allow port 5000)
- [ ] Set NODE_ENV=production

### Frontend
- [ ] Update VITE_API_URL ke production URL
- [ ] Enable HTTPS
- [ ] Configure Nginx security headers
- [ ] Set proper CORS
- [ ] Minify build output

---

## 📝 Quick Reference

### Build Commands
```bash
# Backend
cd backend && ./deploy-backend.sh

# Frontend
cd frontend && ./deploy-frontend.sh
```

### Run Commands
```bash
# Backend (manual)
cd backend && ./run-backend.sh

# Backend (PM2)
pm2 start backend/run-backend.sh --name e-evkin-backend

# Frontend (preview)
cd frontend && ./run-frontend.sh

# Frontend (production with Nginx)
# Just deploy dist/ to /var/www
```

### Environment Files
```bash
# Backend
backend/.env          # Production config
backend/.env.example  # Template

# Frontend
frontend/.env         # Production config
frontend/.env.example # Template
```

---

## 🎯 Summary

1. **Backend**: Build → Seed (first time) → Run with PM2
2. **Frontend**: Build → Deploy dist/ to Nginx
3. **Configuration**: Update .env files for both
4. **CORS**: Backend CORS_ORIGIN must match frontend URL
5. **Scripts**: All scripts are executable via git chmod

**Need help?** Check:
- DEPLOYMENT.md - Full deployment guide
- DATABASE_SEED.md - Database seeding guide
- README.md - Project overview
