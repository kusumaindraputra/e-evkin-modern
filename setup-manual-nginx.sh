#!/bin/bash

# Manual Nginx Setup (Bypass aaPanel interface)
# Setup website manual tanpa aaPanel web interface

echo "🌐 Manual Nginx Setup for E-EVKIN Modern"
echo "========================================"

# Variables
DOMAIN="103.197.189.168"
APP_DIR="/www/wwwroot/e-evkin-modern"
NGINX_CONF="/etc/nginx/sites-available/e-evkin-modern"
NGINX_ENABLED="/etc/nginx/sites-enabled/e-evkin-modern"

echo "🔍 Current setup status:"
echo "Domain/IP: $DOMAIN"
echo "App Directory: $APP_DIR"
echo "Backend: Running on port 5000"

# Check if frontend is built
echo ""
echo "🔍 Checking frontend build..."
if [ -d "$APP_DIR/frontend/dist" ] && [ -f "$APP_DIR/frontend/dist/index.html" ]; then
    echo "✅ Frontend build exists"
    echo "📊 Frontend files:"
    ls -la "$APP_DIR/frontend/dist/" | head -10
else
    echo "❌ Frontend build not found"
    echo "🔧 Building frontend..."
    cd "$APP_DIR/frontend"
    npm install
    npm run build
    
    if [ -f "dist/index.html" ]; then
        echo "✅ Frontend built successfully"
    else
        echo "❌ Frontend build failed"
        exit 1
    fi
fi

echo ""
echo "🔧 Creating Nginx configuration..."

# Create nginx config
cat > $NGINX_CONF << EOF
server {
    listen 80;
    server_name $DOMAIN;
    root $APP_DIR/frontend/dist;
    index index.html;

    # Frontend routes (React Router)
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma no-cache;
        add_header Expires 0;
    }

    # API proxy to backend
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

echo "✅ Nginx configuration created"

# Enable site
ln -sf $NGINX_CONF $NGINX_ENABLED

# Test nginx config
echo ""
echo "🧪 Testing Nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

# Reload nginx
echo ""
echo "🔄 Reloading Nginx..."
systemctl reload nginx

if [ $? -eq 0 ]; then
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Failed to reload Nginx"
    systemctl status nginx
    exit 1
fi

# Test backend
echo ""
echo "🧪 Testing backend connectivity..."
if curl -f -s http://127.0.0.1:5000/health > /dev/null; then
    echo "✅ Backend is responding"
else
    echo "❌ Backend is not responding"
    echo "🔧 Checking PM2..."
    pm2 list
fi

# Test website
echo ""
echo "🧪 Testing website access..."
if curl -f -s http://127.0.0.1/ > /dev/null; then
    echo "✅ Website is accessible locally"
else
    echo "❌ Website is not accessible"
    echo "🔍 Checking Nginx status..."
    systemctl status nginx
fi

echo ""
echo "🎉 Manual setup completed!"
echo "=========================="
echo ""
echo "📊 Access Information:"
echo "Website URL: http://$DOMAIN"
echo "API URL: http://$DOMAIN/api"
echo "Health Check: http://$DOMAIN/health"
echo ""
echo "👥 Login Credentials:"
echo "Admin: dinkes / dinkes123"
echo "Puskesmas: cibinong / bogorkab"
echo ""
echo "🔍 Verification commands:"
echo "curl http://$DOMAIN/health"
echo "curl http://$DOMAIN/"
echo ""
echo "🔧 Troubleshooting:"
echo "- Check logs: tail -f /var/log/nginx/error.log"
echo "- Check PM2: pm2 logs e-evkin-backend"
echo "- Check Nginx: systemctl status nginx"
echo ""
echo "✅ E-EVKIN Modern is ready at: http://$DOMAIN"