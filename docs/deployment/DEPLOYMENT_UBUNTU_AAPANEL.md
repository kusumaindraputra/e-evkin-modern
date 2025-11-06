# E-EVKIN Modern - Ubuntu 24 + aaPanel Deployment Guide

## 🖥️ Server Specifications
- **OS**: Ubuntu 24.04 LTS
- **Panel**: aaPanel
- **CPU**: 2 Core
- **RAM**: 2GB
- **Storage**: SSD (recommended)

## 📁 Directory Structure untuk aaPanel

### Recommended Clone Location:
```bash
# Clone di direktori aaPanel (RECOMMENDED)
/www/wwwroot/e-evkin-modern/

# BUKAN di /var/www/ karena aaPanel menggunakan /www/wwwroot/
```

### Path Mapping:
```
aaPanel Default Paths:
├── /www/wwwroot/                 # Web documents root
├── /www/server/                  # Server software
├── /www/backup/                  # Backups
└── /www/logs/                    # Logs

E-EVKIN Paths:
├── /www/wwwroot/e-evkin-modern/  # Application root
├── /www/wwwroot/e-evkin-modern/frontend/dist/  # Frontend static files
└── /www/wwwroot/e-evkin-modern/backend/dist/   # Backend compiled JS
```

## 🚀 Step-by-Step Deployment

### 1. Server Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y git curl wget software-properties-common

# Install Node.js 18 (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
node --version  # Should be v18.x.x
npm --version   # Should be 9.x.x or higher

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE e_evkin_staging;
CREATE USER evkin_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE e_evkin_staging TO evkin_user;

# Grant additional permissions for schema creation
ALTER USER evkin_user CREATEDB;

# Exit psql
\q
```

### 3. Clone Repository (IMPORTANT PATH!)

```bash
# Navigate to aaPanel web root
cd /www/wwwroot/

# Clone repository
git clone https://github.com/kusumaindraputra/e-evkin-modern.git

# Set proper ownership
sudo chown -R www-data:www-data e-evkin-modern/

# Navigate to project
cd e-evkin-modern/
```

### 4. Environment Configuration

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit environment file
nano backend/.env
```

**backend/.env content:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=e_evkin_staging
DB_USER=evkin_user
DB_PASSWORD=your_secure_password_here

# JWT Configuration
JWT_SECRET=your_very_long_secure_random_string_here_min_32_chars
JWT_EXPIRE=7d

# Server Configuration
NODE_ENV=staging
PORT=5000
CORS_ORIGIN=http://your-domain.com

# Rate Limiting (optimized for 2GB server)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5. Install Dependencies & Build

```bash
# Make deploy script executable
chmod +x deploy.sh

# First deployment (will install all dependencies and build)
./deploy.sh

# OR step by step:
npm install
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
cd ..
```

### 6. Database Seeding

```bash
# Seed database with initial data
cd backend
npm run seed

# Verify seeding was successful - should show master data and sample reports
# Check logs for "🎉 Seeding completed successfully!"
```

### 7. PM2 Configuration

```bash
# Start application with PM2
pm2 start config/ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup (will run on server reboot)
pm2 startup
# Copy-paste the generated command and run it

# Check status
pm2 status
pm2 logs e-evkin-backend
```

### 8. Nginx Configuration via aaPanel

#### Method 1: Via aaPanel Web Interface (RECOMMENDED)

1. **Login to aaPanel** → Website → Add Site
2. **Domain**: your-domain.com
3. **Root Directory**: `/www/wwwroot/e-evkin-modern/frontend/dist`
4. **PHP Version**: Static (No PHP needed)

5. **Configure Nginx** → Site Settings → Configuration File:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /www/wwwroot/e-evkin-modern/frontend/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
    }

    # Backend API proxy
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        access_log off;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### Method 2: Manual Nginx Configuration

```bash
# Copy nginx config
sudo cp config/nginx.conf /etc/nginx/sites-available/e-evkin

# Edit server_name
sudo nano /etc/nginx/sites-available/e-evkin

# Enable site
sudo ln -s /etc/nginx/sites-available/e-evkin /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 9. Memory Optimization for 2GB Server

```bash
# Create swap file (if not exists)
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize PostgreSQL for 2GB RAM
sudo nano /etc/postgresql/14/main/postgresql.conf
```

**PostgreSQL optimizations:**
```conf
# Memory settings for 2GB server
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 4MB
max_connections = 20

# Performance
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

```bash
# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 10. Firewall & Security

```bash
# Configure UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8888/tcp  # aaPanel port
sudo ufw enable

# Check firewall status
sudo ufw status
```

## 📊 Post-Deployment Verification

### 1. Health Checks

```bash
# Check application health
curl http://localhost:5000/health

# Check frontend
curl http://your-domain.com

# Check PM2 status
pm2 status

# Check memory usage
free -h
htop
```

### 2. Test Login

1. **Open browser**: `http://your-domain.com`
2. **Admin login**: 
   - Username: `dinkes`
   - Password: `dinkes123`
3. **Puskesmas login**:
   - Username: `cibinong`
   - Password: `bogorkab`

### 3. Monitor Logs

```bash
# Application logs
pm2 logs e-evkin-backend

# Nginx logs (via aaPanel)
tail -f /www/wwwlogs/your-domain.com.log

# System logs
journalctl -u nginx -f
```

## 🔄 Regular Maintenance

### Daily Tasks:
```bash
# Check application status
pm2 status

# Monitor memory usage
free -h

# Check disk space
df -h
```

### Weekly Tasks:
```bash
# Update application
cd /www/wwwroot/e-evkin-modern
./deploy.sh --skip-deps  # Quick update

# Backup database
pg_dump -U evkin_user -h localhost e_evkin_staging > backup_$(date +%Y%m%d).sql
```

### Monthly Tasks:
```bash
# Full system update
sudo apt update && sudo apt upgrade

# Clean PM2 logs
pm2 flush

# Clean old backups
find /www/backup/ -name "*.sql" -mtime +30 -delete
```

## 🚨 Troubleshooting

### Common Issues:

**1. Permission Denied**
```bash
sudo chown -R www-data:www-data /www/wwwroot/e-evkin-modern/
sudo chmod -R 755 /www/wwwroot/e-evkin-modern/
```

**2. PM2 Process Killed (OOM)**
```bash
# Check memory usage
pm2 monit

# Check current PM2 config (should have max_memory_restart: '800M')
pm2 show e-evkin-backend

# Restart if needed
pm2 restart e-evkin-backend
```

**3. Database Connection Failed**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U evkin_user -h localhost -d e_evkin_staging
```

**4. Nginx 502 Bad Gateway**
```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs e-evkin-backend

# Test backend directly
curl http://localhost:5000/health
```

**5. Out of Memory**
```bash
# Check memory usage
free -h

# Check swap
swapon --show

# Kill memory-heavy processes if needed
sudo pkill -f "npm|node" # Be careful!
pm2 restart all
```

## 📝 Important Notes

### ✅ DO:
- Use `/www/wwwroot/` path for aaPanel compatibility
- Monitor memory usage regularly (2GB limit)
- Use PM2 fork mode (not cluster) for single instance
- Enable swap file for memory buffer
- Use aaPanel web interface for easier management

### ❌ DON'T:
- Use `/var/www/` path (conflicts with aaPanel)
- Run multiple Node.js instances (memory constraint)
- Skip health checks after deployment
- Ignore memory warnings from PM2

---

**Server Type**: Ubuntu 24 + aaPanel  
**Memory**: 2GB RAM Optimized  
**Updated**: November 6, 2025