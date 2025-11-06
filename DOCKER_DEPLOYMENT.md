# E-EVKIN Modern - Docker Deployment Guide

## 🐳 Overview

Docker deployment menggunakan multi-container setup:
- **PostgreSQL** - Database (container terpisah)
- **Backend** - Node.js API (container terpisah)
- **Frontend** - Nginx static files (container terpisah)

## 📋 Prerequisites

### Install Docker & Docker Compose

#### Ubuntu/Debian
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

#### Windows/Mac
Download Docker Desktop: https://www.docker.com/products/docker-desktop/

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/kusumaindraputra/e-evkin-modern.git
cd e-evkin-modern
git checkout docker-deployment
```

### 2. Setup Environment
```bash
# Copy environment template
cp .env.docker .env

# Edit configuration
nano .env
```

**Update these values:**
```properties
DB_PASSWORD=your_secure_database_password
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
CORS_ORIGIN=http://your-domain.com
VITE_API_URL=http://your-domain.com:5000/api
```

### 3. Build & Run
```bash
# Build all images
./docker/build-all.sh

# Run all services
./docker/run-all.sh

# Seed database (first time only)
docker-compose exec backend npm run seed
```

### 4. Access Application
- Frontend: http://localhost
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

---

## 📦 Build Commands

### Build All Services
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

### Rebuild Without Cache
```bash
docker-compose build --no-cache
```

---

## 🏃 Run Commands

### Run All Services
```bash
./docker/run-all.sh
# Or: docker-compose up -d
```

### Run Backend Only (with Database)
```bash
./docker/run-backend.sh
# Or: docker-compose up -d postgres backend
```

### Run Frontend Only
```bash
./docker/run-frontend.sh
# Or: docker-compose up -d frontend
```

### Run in Foreground (see logs)
```bash
docker-compose up
```

---

## 🛑 Stop & Clean Commands

### Stop All Services
```bash
./docker/stop.sh
# Or: docker-compose stop
```

### Stop Specific Service
```bash
docker-compose stop backend
docker-compose stop frontend
```

### Remove Containers
```bash
docker-compose down
```

### Full Cleanup (containers + volumes + images)
```bash
./docker/clean.sh
# Or: docker-compose down -v && docker rmi evkin-backend evkin-frontend
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

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Execute Commands in Container
```bash
# Access backend shell
docker-compose exec backend sh

# Run seed
docker-compose exec backend npm run seed

# Check Node version
docker-compose exec backend node --version

# Access database
docker-compose exec postgres psql -U admin_evkin -d evkin_db
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific
docker-compose restart backend
```

---

## 🔧 Configuration

### Environment Variables (.env)

```properties
# Node Environment
NODE_ENV=production

# Database
DB_NAME=evkin_db
DB_USER=admin_evkin
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_generated_jwt_secret
JWT_EXPIRE=7d

# CORS (backend accepts requests from this origin)
CORS_ORIGIN=http://localhost

# Frontend API URL
VITE_API_URL=http://localhost:5000/api

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Port Configuration

Default ports:
- **Frontend**: 80
- **Backend**: 5000
- **Database**: 5432

To change ports, edit `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "8080:80"  # External:Internal
  backend:
    ports:
      - "3000:5000"
```

---

## 🌱 Database Seeding

### First Time Setup
```bash
# After containers are running
docker-compose exec backend npm run seed
```

### What Gets Seeded
- 20 Satuan (units)
- 4 Sumber Anggaran (budget sources)
- 3 Kegiatan (activities)
- 7 Sub Kegiatan (sub-activities)
- 1 Admin user (dinkes/dinkes123)
- 102 Puskesmas users (password: bogorkab)
- Sample laporan data

### Reset Database
```bash
# Stop services
docker-compose down -v

# Start again
docker-compose up -d

# Wait for database to be ready
sleep 10

# Seed
docker-compose exec backend npm run seed
```

---

## 🔄 Update Workflow

### Update Application Code
```bash
# Pull latest changes
git pull

# Rebuild images
./docker/build-all.sh

# Restart services
docker-compose down
docker-compose up -d
```

### Update Backend Only
```bash
git pull
./docker/build-backend.sh
docker-compose up -d backend
```

### Update Frontend Only
```bash
git pull
./docker/build-frontend.sh
docker-compose up -d frontend
```

---

## 🏗️ Architecture

### Multi-Container Setup

```
┌─────────────────────────────────────────┐
│           Docker Network                 │
│                                          │
│  ┌──────────────┐                       │
│  │  Frontend    │ :80                   │
│  │  (Nginx)     │                       │
│  └──────┬───────┘                       │
│         │                                │
│         │ HTTP                           │
│         ▼                                │
│  ┌──────────────┐                       │
│  │  Backend     │ :5000                 │
│  │  (Node.js)   │                       │
│  └──────┬───────┘                       │
│         │                                │
│         │ TCP                            │
│         ▼                                │
│  ┌──────────────┐                       │
│  │  PostgreSQL  │ :5432                 │
│  │  (Database)  │                       │
│  └──────────────┘                       │
│                                          │
└─────────────────────────────────────────┘
```

### Volume Persistence

```
postgres_data/
  └── PostgreSQL data files (persisted)
```

---

## 🔍 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Check if port is already in use
sudo lsof -i :5000
sudo lsof -i :80

# Remove old containers
docker-compose down -v
```

### Database Connection Error

```bash
# Check if database is ready
docker-compose exec postgres pg_isready

# Check database logs
docker-compose logs postgres

# Wait for database initialization
docker-compose up -d postgres
sleep 10
docker-compose up -d backend
```

### Frontend Can't Connect to Backend

Check `VITE_API_URL` in `.env`:
```properties
# For local development
VITE_API_URL=http://localhost:5000/api

# For production (same server)
VITE_API_URL=http://your-domain.com:5000/api

# For production (different server)
VITE_API_URL=http://api.your-domain.com/api
```

Rebuild frontend after changing:
```bash
./docker/build-frontend.sh
docker-compose up -d frontend
```

### CORS Error

Update `CORS_ORIGIN` in `.env` to match frontend URL:
```properties
# Local
CORS_ORIGIN=http://localhost

# Production
CORS_ORIGIN=http://your-domain.com
```

Restart backend:
```bash
docker-compose restart backend
```

### Health Check Failing

```bash
# Check backend health
curl http://localhost:5000/api/health

# Check frontend health
curl http://localhost/

# View health check logs
docker inspect evkin-backend | grep -A 10 Health
```

---

## 🔐 Production Deployment

### Security Checklist

- [ ] Generate strong JWT_SECRET
- [ ] Use strong DB_PASSWORD
- [ ] Update CORS_ORIGIN to production domain
- [ ] Enable HTTPS (add reverse proxy like Traefik/Nginx)
- [ ] Set NODE_ENV=production
- [ ] Limit exposed ports (use internal network)
- [ ] Regular backups of postgres_data volume
- [ ] Update default user passwords after first login

### With Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Backup Database

```bash
# Backup
docker-compose exec postgres pg_dump -U admin_evkin evkin_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U admin_evkin evkin_db < backup.sql
```

---

## 📝 Helper Scripts Summary

| Script | Purpose |
|--------|---------|
| `docker/build-all.sh` | Build all Docker images |
| `docker/build-backend.sh` | Build backend image only |
| `docker/build-frontend.sh` | Build frontend image only |
| `docker/run-all.sh` | Run all services |
| `docker/run-backend.sh` | Run backend + database |
| `docker/run-frontend.sh` | Run frontend only |
| `docker/stop.sh` | Stop all services |
| `docker/clean.sh` | Full cleanup |

---

## 🆚 Docker vs Traditional Deployment

| Feature | Docker | Traditional |
|---------|--------|-------------|
| Setup Time | 5 minutes | 30+ minutes |
| Dependencies | Containerized | Manual install |
| Isolation | Complete | Shared system |
| Portability | High | Low |
| Rollback | Easy | Complex |
| Scaling | Simple | Manual |
| Cleanup | One command | Manual |

---

## 📚 Additional Resources

- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
- PostgreSQL Docker: https://hub.docker.com/_/postgres

---

**Branch**: `docker-deployment`  
**Status**: ✅ Production Ready  
**Last Updated**: November 2025
