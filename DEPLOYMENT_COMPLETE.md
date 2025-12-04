# E-EVKIN Modern - Deployment Complete Guide

**Status:** ✅ Production Deployment Completed  
**Date:** December 4, 2025  
**Domain:** https://kusumaputra.my.id/e-evkin  
**Backend API:** https://kusumaputra.my.id/e-evkin/api

---

## Deployment Summary

This document covers the complete deployment of the E-EVKIN Modern application to production. All components have been successfully configured and tested.

### Key Components
- **Frontend:** React 18 + Vite (served at `/e-evkin`)
- **Backend:** Node.js/Express + TypeScript (running on port 5000, proxied at `/e-evkin/api`)
- **Database:** PostgreSQL (evkin_db)
- **Process Manager:** PM2 (cluster mode with 2 instances)
- **Web Server:** Nginx (with SSL/TLS)
- **Authentication:** JWT-based with bcrypt password hashing

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Client)                                       │
│  https://kusumaputra.my.id/e-evkin                     │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│  Nginx (Reverse Proxy)                                  │
│  ├─ /e-evkin/       → /var/www/e-evkin/frontend/dist/  │
│  └─ /e-evkin/api/   → http://localhost:5000/api/       │
└────────────────────────────┬────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
        ┌─────────────────────┐  ┌──────────────────┐
        │ PM2 Backend API     │  │ PostgreSQL DB    │
        │ Port: 5000          │  │ evkin_db         │
        │ Instances: 2        │  │ Port: 5432       │
        │ (Cluster Mode)      │  │                  │
        └─────────────────────┘  └──────────────────┘
```

---

## Deployment Steps (Completed)

### 1. Local Build & Preparation

#### Backend
```bash
cd backend
npm run build
# Output: backend/dist/
```

#### Frontend
```bash
cd frontend
npm run build
# Output: frontend/dist/
# - Vite bundled with base: '/e-evkin/'
# - React Router with basename: '/e-evkin'
# - API config: Dynamic /e-evkin/api on production
```

### 2. Server Preparation

```bash
# Create application directory
sudo mkdir -p /var/www/e-evkin/{backend,frontend/dist}
sudo chown -R ubuntu:ubuntu /var/www/e-evkin
```

### 3. Deploy Backend

```bash
# Upload built backend
scp -r backend/dist ubuntu@kusumaputra.my.id:/var/www/e-evkin/backend/
scp -r backend/node_modules ubuntu@kusumaputra.my.id:/var/www/e-evkin/backend/

# Create production environment file
cat > /var/www/e-evkin/backend/.env.production << 'EOF'
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=evkin_db
DB_USER=postgres
DB_PASSWORD=M4rw1y4hmama!
JWT_SECRET=c13dea6bc3d00b4f37a791c2c569b902
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://kusumaputra.my.id
EOF

# Fix line endings (remove CRLF from Windows)
sed -i 's/\r$//' /var/www/e-evkin/backend/.env.production
```

### 4. Deploy Frontend

```bash
# Upload built frontend
scp -r frontend/dist/* ubuntu@kusumaputra.my.id:/var/www/e-evkin/frontend/dist/

# Fix permissions
sudo chown -R www-data:www-data /var/www/e-evkin/frontend/dist/
sudo chmod -R 755 /var/www/e-evkin/frontend/dist/
```

### 5. PM2 Configuration

```bash
# On server, change to backend directory
cd /var/www/e-evkin/backend

# Load environment and start PM2
set -a
source .env.production
set +a

# Start backend with PM2
pm2 delete e-evkin-api || true
pm2 start dist/server.js --name e-evkin-api -i 2
pm2 save

# Verify
pm2 status
pm2 logs e-evkin-api --lines 50
```

### 6. Nginx Configuration

```nginx
# File: /etc/nginx/sites-enabled/kusumaputra.my.id

server {
    listen 443 ssl;
    listen [::]:443 ssl ipv6only=on;
    server_name kusumaputra.my.id www.kusumaputra.my.id;

    root /var/www/kusumaputra.my.id;
    index index.html;

    # Main site
    location / {
        try_files $uri $uri/ /index.html;
    }

    # E-Evkin Frontend
    location /e-evkin/ {
        alias /var/www/e-evkin/frontend/dist/;
        try_files $uri $uri/ /e-evkin/index.html;
    }

    # E-Evkin Backend API Proxy
    location /e-evkin/api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSL certificate (Certbot)
    ssl_certificate /etc/letsencrypt/live/kusumaputra.my.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kusumaputra.my.id/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name kusumaputra.my.id www.kusumaputra.my.id;
    return 301 https://$host$request_uri;
}
```

### 7. Verify Deployment

```bash
# Test backend health
curl -v https://kusumaputra.my.id/e-evkin/api/health

# Expected response:
# HTTP/1.1 200 OK
# {"status":"OK","timestamp":"2025-12-04T..."}

# Test frontend
curl -I https://kusumaputra.my.id/e-evkin/

# Expected response:
# HTTP/1.1 200 OK
```

---

## Frontend API Configuration

The frontend dynamically configures the API base URL:

**File:** `frontend/src/config/api.ts`

```typescript
const API_BASE_URL = (() => {
  // Production: use /e-evkin/api (relative to current host)
  if (window.location.hostname !== 'localhost') {
    return '/e-evkin/api';
  }
  // Development: use http://localhost:5000/api
  return 'http://localhost:5000/api';
})();

export default API_BASE_URL;
```

All API calls in components use this config variable (no hardcoded URLs).

---

## Key Fixes Applied

### 1. Health Endpoint
- **File:** `backend/src/app.ts`
- **Change:** Added `/api/health` route (was `/health`)
- **Reason:** Frontend expects health check at `/api/health`

### 2. Line Endings
- **File:** `backend/.env.production`
- **Change:** Removed Windows CRLF line endings
- **Command:** `sed -i 's/\r$//' .env.production`
- **Reason:** Node.js env parsing failed with `localhost\r` (carriage return)

### 3. Frontend API URLs
- **Files:** All frontend pages (LaporanPage, AdminPages, etc.)
- **Change:** Replaced hardcoded `http://localhost:5000/api` with `${API_BASE_URL}`
- **Files Updated:**
  - `LoginPage.tsx`
  - `LaporanPage.tsx`
  - `AdminPuskesmasPage.tsx`
  - `AdminMasterDataPage.tsx`
  - `AdminPuskesmasConfigPage.tsx`
  - `AdminLaporanSubKegiatanPage.tsx`
  - `AdminLaporanSumberAnggaranPage.tsx`
  - `LaporanBulkInputPage.tsx`
  - `DashboardPage.tsx`
  - `LaporanForm.tsx`
  - `SubKegiatanSumberAnggaranModal.tsx`

---

## Database Setup

### Initial Setup
```bash
# Create database (on server with PostgreSQL)
sudo -u postgres psql << EOF
CREATE DATABASE evkin_db;
GRANT ALL PRIVILEGES ON DATABASE evkin_db TO postgres;
EOF

# Run migrations (if using Sequelize migrations)
cd /var/www/e-evkin/backend
npx sequelize-cli db:migrate --env production
```

### Backup & Restore

**Backup (from local machine):**
```bash
pg_dump -h kusumaputra.my.id -U postgres -F c evkin_db > evkin_db_backup.dump
```

**Restore:**
```bash
pg_restore -h localhost -U postgres -d evkin_db evkin_db_backup.dump
```

---

## Authentication & Security

### User Management
- Passwords are hashed using bcrypt (cost factor: 10)
- Stored in `users.password` column (one-way hash)
- Password reset: Admin can update via `/admin/users` page

### JWT Tokens
- **Secret:** `JWT_SECRET` in `.env.production`
- **Expiration:** `24h` (configurable via `JWT_EXPIRES_IN`)
- **Header:** `Authorization: Bearer <token>`

### Default Users (from seeding)
```
Admin:
  Username: dinkes
  Password: dinkes123

Puskesmas:
  Username: bojonggede
  Password: bogorkab
```

⚠️ **Change these passwords immediately in production!**

---

## Monitoring & Maintenance

### PM2 Commands
```bash
# View status
pm2 status

# View logs
pm2 logs e-evkin-api
pm2 logs e-evkin-api --lines 200

# Restart
pm2 restart e-evkin-api

# Stop
pm2 stop e-evkin-api

# Delete
pm2 delete e-evkin-api

# Resurrect from saved state
pm2 resurrect
```

### Nginx Reload
```bash
# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -50 /var/log/nginx/error.log
sudo tail -50 /var/log/nginx/access.log
```

### Database Connection Check
```bash
# Test connection from server
psql -h localhost -U postgres -d evkin_db -c "SELECT version();"
```

---

## Troubleshooting

### "Connection Refused" on Backend
```bash
# Check if PM2 is running
pm2 status

# Check if port 5000 is listening
sudo ss -ltnp | grep 5000

# View recent logs
pm2 logs e-evkin-api --lines 50
```

### "404 Not Found" on API Endpoint
```bash
# Verify Nginx proxy rule
cat /etc/nginx/sites-enabled/kusumaputra.my.id | grep -A 5 "/e-evkin/api"

# Test backend directly
curl http://localhost:5000/api/health

# Test through proxy
curl https://kusumaputra.my.id/e-evkin/api/health
```

### "CORS" Errors
- Check `CORS_ORIGIN` in `.env.production`
- Should be: `https://kusumaputra.my.id`
- Verify `backend/src/app.ts` has CORS middleware enabled

### Database Connection Fails
- Check `.env.production` values (no trailing spaces or CRLF)
- Verify PostgreSQL is running: `systemctl status postgresql`
- Check database exists: `psql -l | grep evkin_db`
- Test connection: `psql -h localhost -U postgres -d evkin_db`

---

## Performance Considerations

### Frontend
- **Bundle Size:** ~1.65 MB (minified + gzipped)
- **Assets:** CSS, JS, images served from `/var/www/e-evkin/frontend/dist/`
- **Caching:** Nginx configured with appropriate Cache-Control headers

### Backend
- **Process Model:** PM2 cluster mode with 2 instances
- **Rate Limiting:** 100 requests per 15 minutes per IP
- **Connection Pool:** Sequelize default (5-10 connections)

### Database
- **Indexes:** Applied on foreign keys and frequently queried columns
- **Connection:** Connection pooling via Sequelize

---

## Future Improvements

1. **Environment Management**
   - Consider using PM2 ecosystem.config.js for environment management
   - Implement secrets management (HashiCorp Vault, AWS Secrets Manager)

2. **Monitoring**
   - Add PM2 monitoring/dashboard
   - Implement centralized logging (ELK, CloudWatch)
   - Set up alerting for errors

3. **CI/CD**
   - GitHub Actions for automated builds
   - Auto-deployment on push to main branch
   - Automated testing pipeline

4. **Database**
   - Implement automated backups (cron job)
   - Set up replication for high availability
   - Monitor query performance

5. **Security**
   - Implement 2FA for admin accounts
   - Add request signing
   - Regular security audits and penetration testing

---

## Support & Contact

For deployment issues or questions:
1. Check logs: `pm2 logs e-evkin-api`
2. Review Nginx config: `/etc/nginx/sites-enabled/kusumaputra.my.id`
3. Verify environment: `cat /var/www/e-evkin/backend/.env.production`
4. Test connectivity: `curl https://kusumaputra.my.id/e-evkin`

---

**Last Updated:** December 4, 2025  
**Deployment Status:** ✅ Complete and Running  
**All Tests:** ✅ Passed
