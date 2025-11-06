#!/bin/bash

# E-EVKIN MODERN - GIT-BASED DEPLOYMENT
# Clone from GitHub and deploy pre-built application

echo "============================================"
echo "E-EVKIN MODERN - GIT DEPLOYMENT"
echo "============================================"
echo ""

# Configuration
REPO_URL="https://github.com/kusumaindraputra/e-evkin-modern.git"
APP_DIR="/www/wwwroot/e-evkin-modern"
DB_NAME="eevkin_modern"
DB_USER="eevkin_user"
DB_PASSWORD="eevkin123"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root: sudo bash git-deploy.sh"
    exit 1
fi

echo "This will deploy E-EVKIN Modern from GitHub with pre-built files"
echo ""

# Update system
echo "Updating system packages..."
apt-get update

# Install Git if not present
if ! command -v git &> /dev/null; then
    echo "Installing Git..."
    apt-get install -y git
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

# Install PostgreSQL if not present
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    apt-get install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "Installing nginx..."
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
fi

# Clone or update repository
echo "Cloning/updating repository..."
if [ -d "$APP_DIR" ]; then
    echo "Updating existing repository..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/master
    git clean -fd
else
    echo "Cloning repository..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# Setup database
echo "Setting up database..."
sudo -u postgres psql << EOSQL
DROP DATABASE IF EXISTS $DB_NAME;
DROP ROLE IF EXISTS $DB_USER;
CREATE DATABASE $DB_NAME;
CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER ROLE $DB_USER CREATEDB;
ALTER DATABASE $DB_NAME SET timezone TO 'Asia/Jakarta';
EOSQL

# Setup backend
echo "Setting up backend..."
cd "$APP_DIR/backend"

# Install production dependencies
npm ci --only=production

# Create environment file
cat > .env << ENVEOF
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=http://103.197.189.168,http://kusumaputra.my.id,https://kusumaputra.my.id
ENVEOF

# Start backend with PM2
echo "Starting backend service..."
pm2 delete eevkin-backend 2>/dev/null || true
pm2 start dist/server.js --name eevkin-backend --max-memory-restart 1500M
pm2 save
pm2 startup

# Setup nginx
echo "Configuring nginx..."
cat > /etc/nginx/sites-available/eevkin << 'NGINXEOF'
server {
    listen 80;
    server_name 103.197.189.168 kusumaputra.my.id;
    
    # Frontend
    location / {
        root /www/wwwroot/e-evkin-modern/frontend/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
        
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
NGINXEOF

# Enable site
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/eevkin /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Set proper permissions
chown -R www-data:www-data "$APP_DIR"

# Seed database
echo "Seeding database..."
cd "$APP_DIR/backend"
node dist/seeders/seedReference.js
node dist/seeders/seed2025.js

echo ""
echo "✅ E-EVKIN Modern deployed successfully!"
echo ""
echo "🌐 Frontend: http://103.197.189.168"
echo "🔌 Backend API: http://103.197.189.168/api"
echo "📊 Admin login: admin@eevkin.com / admin123"
echo ""
echo "Services status:"
pm2 status
echo ""
echo "Nginx status:"
systemctl status nginx --no-pager -l
echo ""
echo "PostgreSQL status:"
systemctl status postgresql --no-pager -l