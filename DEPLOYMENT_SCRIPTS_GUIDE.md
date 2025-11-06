# E-EVKIN Modern - Deployment Scripts Quick Guide

## ✅ What's Been Created

### Executable Scripts

#### Backend (2 scripts)
```bash
backend/deploy-backend.sh    # Build backend + create .env if needed
backend/run-backend.sh       # Run backend server
```

#### Frontend (2 scripts)
```bash
frontend/deploy-frontend.sh  # Build frontend + create .env if needed
frontend/run-frontend.sh     # Run frontend preview
```

#### Helper
```bash
make-executable.sh           # Helper to make all scripts executable
```

### Configuration Templates

```bash
backend/.env.example         # Backend environment template
frontend/.env.example        # Frontend environment template
```

### Documentation

```bash
DEPLOYMENT_SEPARATE.md       # Complete guide for separate deployment
DATABASE_SEED.md             # Database seeding guide
SEED_SUMMARY.md              # Quick seed reference
```

---

## 🚀 Quick Start

### Backend Deployment

```bash
cd backend

# 1. Create .env (first time)
./deploy-backend.sh  # Will create .env and exit

# 2. Edit .env
nano .env
# Update: DB_PASSWORD, JWT_SECRET, CORS_ORIGIN

# 3. Build
./deploy-backend.sh

# 4. Seed (first time only!)
npm run seed

# 5. Run
./run-backend.sh
# Or with PM2: pm2 start run-backend.sh --name e-evkin-backend
```

---

### Frontend Deployment

```bash
cd frontend

# 1. Create .env (first time)
./deploy-frontend.sh  # Will create .env and exit

# 2. Edit .env
nano .env
# Update: VITE_API_URL=https://your-backend-domain.com/api

# 3. Build
./deploy-frontend.sh

# 4. Deploy to Nginx
sudo cp -r dist/* /var/www/e-evkin-frontend/
```

---

## 📋 Environment Configuration

### Backend .env (Production)

```properties
NODE_ENV=production
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=evkin_db
DB_USER=admin_evkin
DB_PASSWORD=YOUR_SECURE_PASSWORD    # ← CHANGE THIS

JWT_SECRET=YOUR_JWT_SECRET_KEY      # ← CHANGE THIS
JWT_EXPIRE=7d

CORS_ORIGIN=https://your-frontend-domain.com  # ← CHANGE THIS

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend .env (Production)

```properties
# Point to your backend API
VITE_API_URL=https://your-backend-domain.com/api
```

---

## 🔧 Git Commands (Already Done)

File-file sudah ditambahkan dengan executable permission:

```bash
✅ git add --chmod=+x backend/deploy-backend.sh
✅ git add --chmod=+x backend/run-backend.sh
✅ git add --chmod=+x frontend/deploy-frontend.sh
✅ git add --chmod=+x frontend/run-frontend.sh
✅ git add --chmod=+x make-executable.sh
```

**Tinggal commit dan push:**

```bash
git commit -m "Add separate deployment scripts for frontend and backend"
git push
```

---

## 📦 Deployment Scenarios

### Scenario 1: Same Server, Different Ports

**Backend (.env):**
```properties
PORT=5000
CORS_ORIGIN=http://your-domain.com
```

**Frontend (.env):**
```properties
VITE_API_URL=http://your-domain.com:5000/api
```

**Nginx config:** Proxy /api to port 5000

---

### Scenario 2: Different Servers

**Backend Server (.env):**
```properties
PORT=5000
CORS_ORIGIN=https://frontend.example.com
```

**Frontend Server (.env):**
```properties
VITE_API_URL=https://api.example.com/api
```

---

### Scenario 3: Subdomain

**Backend (api.evkin.com):**
```properties
PORT=5000
CORS_ORIGIN=https://evkin.com
```

**Frontend (evkin.com):**
```properties
VITE_API_URL=https://api.evkin.com/api
```

---

## 🔄 Update Workflow

### Update Backend
```bash
git pull
cd backend
./deploy-backend.sh
pm2 restart e-evkin-backend
```

### Update Frontend
```bash
git pull
cd frontend
./deploy-frontend.sh
sudo rsync -av dist/ /var/www/e-evkin-frontend/
sudo nginx -s reload
```

---

## ✅ Verification Commands

### Check Backend
```bash
# API health check
curl http://localhost:5000/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Check Frontend
```bash
# Check if frontend is accessible
curl http://your-domain.com

# Should return HTML content
```

### Check Logs
```bash
# Backend logs (PM2)
pm2 logs e-evkin-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🐛 Common Issues

### Backend: Port Already in Use
```bash
# Find process
lsof -i :5000

# Kill it
kill -9 <PID>
```

### Frontend: CORS Error
```bash
# Check backend CORS_ORIGIN matches frontend URL
# Check browser console for exact error
```

### Scripts Not Executable
```bash
# If git chmod didn't work, use regular chmod
chmod +x backend/deploy-backend.sh
chmod +x backend/run-backend.sh
chmod +x frontend/deploy-frontend.sh
chmod +x frontend/run-frontend.sh
```

---

## 📝 Files Summary

| File | Purpose | Executable |
|------|---------|------------|
| `backend/deploy-backend.sh` | Build backend | ✅ Yes |
| `backend/run-backend.sh` | Run backend | ✅ Yes |
| `frontend/deploy-frontend.sh` | Build frontend | ✅ Yes |
| `frontend/run-frontend.sh` | Run frontend preview | ✅ Yes |
| `make-executable.sh` | Helper script | ✅ Yes |
| `backend/.env.example` | Backend config template | - |
| `frontend/.env.example` | Frontend config template | - |
| `DEPLOYMENT_SEPARATE.md` | Full guide | - |

---

## 🎯 Next Steps

1. ✅ Scripts created with executable permission
2. ✅ Templates created (.env.example)
3. ✅ Documentation created
4. ⏳ **Commit changes:** `git commit -m "Add separate deployment scripts"`
5. ⏳ **Push to repository:** `git push`
6. ⏳ **Deploy to server**

---

## 📚 Related Documentation

- **DEPLOYMENT_SEPARATE.md** - Complete separate deployment guide
- **DEPLOYMENT.md** - Original full deployment guide
- **DATABASE_SEED.md** - Database seeding guide
- **README.md** - Project overview

---

## 💡 Tips

1. **Backend must be deployed first** (frontend depends on backend API)
2. **Update CORS_ORIGIN** in backend to match frontend URL
3. **Use PM2** for backend in production (auto-restart, logs)
4. **Use Nginx** for frontend (better performance, caching)
5. **Change default passwords** for security
6. **Enable HTTPS** in production

---

**Status**: ✅ **READY FOR DEPLOYMENT**

All scripts are executable and ready to use on Linux servers!
