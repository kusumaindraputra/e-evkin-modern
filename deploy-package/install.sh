#!/bin/bash

set -e

echo "Setting up E-EVKIN Modern on server..."

# Configuration
APP_DIR="/www/wwwroot/e-evkin-modern"
DB_NAME="eevkin_modern"
DB_USER="eevkin_user"
DB_PASSWORD="eevkin123"

# Check root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root: sudo bash install.sh"
    exit 1
fi

# Install Node.js 22
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    apt-get update
    apt-get install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Setup directories
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Copy application files from current directory
echo "Copying application files..."
rm -rf backend frontend
mkdir -p backend frontend

cp -r ../deploy-package/backend-dist backend/dist
cp ../deploy-package/package.json backend/
mkdir -p backend/src
cp -r ../deploy-package/seeders backend/src/seeders
cp -r ../deploy-package/frontend-dist frontend/dist

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm ci --only=production

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

# Create environment file
echo "Creating environment configuration..."
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

# Start with PM2
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

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/eevkin /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Set proper permissions
chown -R www-data:www-data "$APP_DIR"

echo ""
echo "✅ E-EVKIN Modern installed successfully!"
echo "🌐 Frontend: http://103.197.189.168"
echo "🔌 Backend API: http://103.197.189.168/api"
echo ""
echo "Next steps:"
echo "1. Check if services are running: pm2 status"
echo "2. Check nginx: systemctl status nginx"
echo "3. Seed database: cd $APP_DIR/backend && node src/seeders/seedReference.js && node src/seeders/seed2025.js"

