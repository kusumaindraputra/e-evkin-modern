# 🐳 Docker Deployment - Quick Start Guide

## ✅ Branch Created: `docker-deployment`

Branch baru untuk versi Docker dengan **multi-container setup**:
- **PostgreSQL** - Database container
- **Backend** - Node.js API container  
- **Frontend** - Nginx container

---

## 📦 What's Included

### Docker Configuration Files

```
e-evkin-modern/
├── docker-compose.yml              # Multi-container orchestration
├── .env.docker                     # Environment template
├── init-db.sql                     # Database initialization
│
├── backend/
│   ├── Dockerfile                  # Backend multi-stage build
│   └── .dockerignore              # Exclude unnecessary files
│
├── frontend/
│   ├── Dockerfile                  # Frontend multi-stage build
│   ├── nginx.conf                 # Nginx configuration
│   └── .dockerignore              # Exclude unnecessary files
│
└── docker/
    ├── build-all.sh               # ✅ Build all images
    ├── build-backend.sh           # ✅ Build backend only
    ├── build-frontend.sh          # ✅ Build frontend only
    ├── run-all.sh                 # ✅ Run all services
    ├── run-backend.sh             # ✅ Run backend + DB
    ├── run-frontend.sh            # ✅ Run frontend only
    ├── stop.sh                    # ✅ Stop all services
    └── clean.sh                   # ✅ Cleanup everything
```

All scripts marked as **executable** (mode 100755)

---

## 🚀 Quick Start

### 1. Checkout Docker Branch
```bash
git checkout docker-deployment
```

### 2. Setup Environment
```bash
# Copy template
cp .env.docker .env

# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Edit .env and update:
nano .env
```

**Required changes:**
```properties
DB_PASSWORD=your_secure_password
JWT_SECRET=<generated_secret_above>
CORS_ORIGIN=http://localhost
VITE_API_URL=http://localhost:5000/api
```

### 3. Build & Run
```bash
# Build all images
./docker/build-all.sh

# Run all services
./docker/run-all.sh

# Seed database (first time)
docker-compose exec backend npm run seed
```

### 4. Access Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health
- **Database**: localhost:5432

---

## 🔨 Build Commands

### Build All
```bash
./docker/build-all.sh
# Or: docker-compose build
```

### Build Backend Only
```bash
./docker/build-backend.sh
# Or: docker build -t evkin-backend:latest ./backend
```

### Build Frontend Only
```bash
./docker/build-frontend.sh
# Or: docker build -t evkin-frontend:latest ./frontend
```

**Features:**
- ✅ Multi-stage builds (smaller images)
- ✅ Production optimization
- ✅ Non-root users for security
- ✅ Health checks
- ✅ Prerequisites check (Docker installed)

---

## 🏃 Run Commands

### Run All Services
```bash
./docker/run-all.sh
# Or: docker-compose up -d
```

**Starts:**
- PostgreSQL database
- Backend API
- Frontend Nginx

### Run Backend + Database
```bash
./docker/run-backend.sh
# Or: docker-compose up -d postgres backend
```

### Run Frontend Only
```bash
./docker/run-frontend.sh
# Or: docker-compose up -d frontend
```

**Features:**
- ✅ Auto-create .env if missing
- ✅ Interactive prompts
- ✅ Health check wait
- ✅ Status display
- ✅ Useful commands hints

---

## 🛑 Stop & Clean

### Stop All
```bash
./docker/stop.sh
# Or: docker-compose stop
```

### Remove Containers
```bash
docker-compose down
```

### Full Cleanup (⚠️ Deletes data!)
```bash
./docker/clean.sh
# Or: docker-compose down -v
```

---

## 📊 Management Commands

### Check Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend

# Database only
docker-compose logs -f postgres
```

### Execute Commands
```bash
# Access backend shell
docker-compose exec backend sh

# Run seed
docker-compose exec backend npm run seed

# Access database
docker-compose exec postgres psql -U admin_evkin -d evkin_db

# Check backend health
curl http://localhost:5000/api/health
```

### Restart Services
```bash
# All
docker-compose restart

# Backend only
docker-compose restart backend
```

---

## 🔄 Update Workflow

```bash
# Pull latest changes
git pull

# Rebuild images
./docker/build-all.sh

# Restart services
docker-compose down
docker-compose up -d
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│        Docker Network               │
│                                      │
│  ┌──────────────┐                  │
│  │  Frontend    │  Port 80         │
│  │  (Nginx)     │                  │
│  └──────┬───────┘                  │
│         │                           │
│         ▼                           │
│  ┌──────────────┐                  │
│  │  Backend     │  Port 5000       │
│  │  (Node.js)   │                  │
│  └──────┬───────┘                  │
│         │                           │
│         ▼                           │
│  ┌──────────────┐                  │
│  │  PostgreSQL  │  Port 5432       │
│  │  (Database)  │                  │
│  └──────────────┘                  │
│                                      │
└─────────────────────────────────────┘
```

**Volume Persistence:**
- `postgres_data` - Database files (persisted)

---

## 🔧 Configuration

### Environment Variables (.env)

```properties
# Database
DB_NAME=evkin_db
DB_USER=admin_evkin
DB_PASSWORD=your_password          # ← CHANGE!

# JWT
JWT_SECRET=your_jwt_secret         # ← CHANGE!
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost       # ← UPDATE for production

# Frontend API
VITE_API_URL=http://localhost:5000/api  # ← UPDATE for production
```

### Port Mapping

Default ports (can be changed in docker-compose.yml):
```yaml
frontend: 80:80
backend: 5000:5000
postgres: 5432:5432
```

---

## 🌱 Database Seeding

```bash
# After containers are running
docker-compose exec backend npm run seed
```

**Seeds:**
- 20 Satuan
- 4 Sumber Anggaran
- 3 Kegiatan
- 7 Sub Kegiatan
- 1 Admin (dinkes/dinkes123)
- 102 Puskesmas (password: bogorkab)
- Sample laporan data

---

## 🆚 Docker vs Traditional

| Feature | Docker | Traditional |
|---------|--------|-------------|
| **Setup Time** | 5 mins | 30+ mins |
| **Prerequisites** | Docker only | Node, PostgreSQL, PM2, Nginx |
| **Build** | One command | Multiple steps |
| **Run** | One command | Multiple terminals |
| **Isolation** | Complete | Shared system |
| **Cleanup** | One command | Manual |
| **Portability** | Run anywhere | Environment-specific |
| **Rollback** | Easy | Complex |

---

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Find process
sudo lsof -i :80
sudo lsof -i :5000

# Stop existing containers
docker-compose down
```

### Database Connection Failed
```bash
# Check database is ready
docker-compose exec postgres pg_isready

# View logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

### Frontend Can't Reach Backend
```bash
# Check VITE_API_URL in .env
cat .env | grep VITE_API_URL

# Should be: http://localhost:5000/api

# Rebuild frontend
./docker/build-frontend.sh
docker-compose up -d frontend
```

### CORS Error
```bash
# Update CORS_ORIGIN in .env
CORS_ORIGIN=http://localhost

# Restart backend
docker-compose restart backend
```

---

## 📝 Helper Scripts Summary

| Script | Purpose | Command |
|--------|---------|---------|
| `build-all.sh` | Build all images | `./docker/build-all.sh` |
| `build-backend.sh` | Build backend only | `./docker/build-backend.sh` |
| `build-frontend.sh` | Build frontend only | `./docker/build-frontend.sh` |
| `run-all.sh` | Run all services | `./docker/run-all.sh` |
| `run-backend.sh` | Run backend + DB | `./docker/run-backend.sh` |
| `run-frontend.sh` | Run frontend only | `./docker/run-frontend.sh` |
| `stop.sh` | Stop all services | `./docker/stop.sh` |
| `clean.sh` | Full cleanup | `./docker/clean.sh` |

---

## 📚 Documentation

- **DOCKER_DEPLOYMENT.md** - Complete Docker guide
- **docker-compose.yml** - Service orchestration
- **.env.docker** - Environment template

---

## 🎯 Production Deployment

### Security Checklist
- [ ] Generate strong JWT_SECRET
- [ ] Use strong DB_PASSWORD
- [ ] Update CORS_ORIGIN to production domain
- [ ] Update VITE_API_URL to production API
- [ ] Enable HTTPS (add reverse proxy)
- [ ] Limit exposed ports
- [ ] Regular database backups
- [ ] Change default passwords

### Backup Database
```bash
# Backup
docker-compose exec postgres pg_dump -U admin_evkin evkin_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U admin_evkin evkin_db < backup.sql
```

---

## ✨ Key Features

1. **Multi-Container Setup** - Isolated services
2. **Separate Build Commands** - Build backend/frontend independently
3. **Separate Run Commands** - Run services independently
4. **Health Checks** - All services monitored
5. **Volume Persistence** - Database data persisted
6. **Security** - Non-root users, security headers
7. **Optimization** - Multi-stage builds, smaller images
8. **User-Friendly Scripts** - Interactive with clear output

---

## 📊 Git Status

```
✅ Branch: docker-deployment
✅ Commit: b7eba0e
✅ Files: 16 new files
✅ Insertions: +1,296 lines
✅ Scripts: All executable (mode 100755)
```

---

## 🎉 Ready to Deploy!

```bash
# 1. Checkout branch
git checkout docker-deployment

# 2. Setup
cp .env.docker .env
nano .env  # Update values

# 3. Build
./docker/build-all.sh

# 4. Run
./docker/run-all.sh

# 5. Seed
docker-compose exec backend npm run seed

# 6. Access
open http://localhost
```

**Status**: ✅ **Production Ready with Docker!**
