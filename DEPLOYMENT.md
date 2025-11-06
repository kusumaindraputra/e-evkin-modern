# E-EVKIN Modern - Deployment Guide

## Deployment ke Server Staging

### Prerequisites
- Node.js v18 atau lebih tinggi
- PostgreSQL 14 atau lebih tinggi
- PM2 (untuk process management)
- Nginx (untuk reverse proxy)

### 1. Persiapan Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### 2. Setup Database

```bash
# Login ke PostgreSQL
sudo -u postgres psql

# Buat database dan user
CREATE DATABASE e_evkin_staging;
CREATE USER evkin_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE e_evkin_staging TO evkin_user;
\q
```

### 3. Deploy Aplikasi

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/kusumaindraputra/e-evkin-modern.git
sudo chown -R $USER:$USER e-evkin-modern
cd e-evkin-modern

# Install dependencies
npm install

# Setup Backend Environment
cd backend
cp .env.staging .env

# Edit .env dengan kredensial yang benar
nano .env
# Update DB_PASSWORD, JWT_SECRET, CORS_ORIGIN

# Build backend
npm run build

# Kembali ke root
cd ..
```

### 4. Build Frontend

```bash
cd frontend

# Build frontend untuk production
npm run build

# Hasil build ada di folder dist/
```

### 5. Setup PM2 untuk Backend

```bash
cd /var/www/e-evkin-modern

# Buat file ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'e-evkin-backend',
    cwd: './backend',
    script: 'dist/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Start aplikasi dengan PM2
pm2 start ecosystem.config.js

# Setup PM2 startup
pm2 startup
pm2 save
```

### 6. Setup Nginx

```bash
# Buat konfigurasi Nginx
sudo nano /etc/nginx/sites-available/e-evkin
```

Isi dengan:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/e-evkin-modern/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
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

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/e-evkin /etc/nginx/sites-enabled/

# Test konfigurasi
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 7. Setup SSL (Opsional tapi Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Dapatkan SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal sudah di-setup otomatis oleh certbot
```

### 8. Database Migration & Seed

```bash
cd /var/www/e-evkin-modern/backend

# Jalankan migrations (jika ada)
# npm run migrate

# Seed data awal (opsional)
# npm run seed
```

### 9. Monitoring & Logs

```bash
# Monitor aplikasi
pm2 monit

# Lihat logs
pm2 logs e-evkin-backend

# Restart aplikasi
pm2 restart e-evkin-backend

# Stop aplikasi
pm2 stop e-evkin-backend
```

### 10. Update Deployment

```bash
cd /var/www/e-evkin-modern

# Pull latest changes
git pull origin master

# Install new dependencies (jika ada)
npm install

# Rebuild backend
cd backend
npm run build

# Rebuild frontend
cd ../frontend
npm run build

# Restart backend
pm2 restart e-evkin-backend
```

## Environment Variables yang Harus Diubah

### Backend (.env)
- `DB_PASSWORD` - Password database PostgreSQL
- `JWT_SECRET` - String random yang aman (minimal 32 karakter)
- `CORS_ORIGIN` - URL frontend staging (e.g., http://staging.yourdomain.com)

### Frontend (vite.config.ts atau .env jika ada)
- API Base URL - Sesuaikan dengan URL backend

## Checklist Deployment

- [ ] Server setup (Node.js, PostgreSQL, PM2, Nginx)
- [ ] Database created dan user configured
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Backend built successfully
- [ ] Frontend built successfully
- [ ] PM2 configured dan running
- [ ] Nginx configured dan running
- [ ] SSL certificate installed (opsional)
- [ ] Database seeded dengan data awal
- [ ] Test akses frontend
- [ ] Test akses API backend
- [ ] Monitor logs untuk errors

## Default Credentials (Development)

**Admin:**
- Username: `dinkes`
- Password: `dinkes123`

**Puskesmas (contoh):**
- Username: `cibinong`
- Password: `cibinong123`

**⚠️ IMPORTANT:** Ganti password default setelah deployment!

## Troubleshooting

### Backend tidak bisa connect ke database
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U evkin_user -d e_evkin_staging -h localhost
```

### PM2 app crashed
```bash
# Check logs
pm2 logs e-evkin-backend --lines 100

# Restart
pm2 restart e-evkin-backend
```

### Nginx error
```bash
# Check nginx status
sudo systemctl status nginx

# Check nginx error log
sudo tail -f /var/log/nginx/error.log
```

### CORS error
- Pastikan `CORS_ORIGIN` di backend .env sesuai dengan URL frontend
- Restart backend setelah mengubah .env

## Support

Untuk bantuan lebih lanjut, hubungi tim development atau buka issue di repository GitHub.
