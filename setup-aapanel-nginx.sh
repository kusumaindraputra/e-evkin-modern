#!/bin/bash

# aaPanel Compatible Nginx Setup for E-EVKIN Modern
echo "🌐 aaPanel Nginx Setup for E-EVKIN Modern"
echo "========================================="

# Variables
DOMAIN="103.197.189.168"
APP_DIR="/www/wwwroot/e-evkin-modern"
AAPANEL_NGINX_CONF="/www/server/panel/webserver/conf"
VHOST_DIR="$AAPANEL_NGINX_CONF/vhost"
SITE_CONF="$VHOST_DIR/$DOMAIN.conf"

echo "🔍 aaPanel Nginx setup:"
echo "Domain: $DOMAIN"
echo "Config Dir: $AAPANEL_NGINX_CONF"
echo "Site Config: $SITE_CONF"

# Check aaPanel nginx binary
NGINX_BIN="/www/server/panel/webserver/sbin/webserver"
if [ -f "$NGINX_BIN" ]; then
    echo "✅ aaPanel Nginx found: $NGINX_BIN"
else
    echo "❌ aaPanel Nginx not found"
    exit 1
fi

# Create vhost directory if not exists
mkdir -p "$VHOST_DIR"

# Check frontend build
if [ ! -d "$APP_DIR/frontend/dist" ] || [ ! -f "$APP_DIR/frontend/dist/index.html" ]; then
    echo "❌ Frontend build not found"
    echo "🔧 Building frontend..."
    cd "$APP_DIR/frontend"
    npm install
    npm run build
    
    if [ ! -f "dist/index.html" ]; then
        echo "❌ Frontend build failed"
        exit 1
    fi
    echo "✅ Frontend built successfully"
else
    echo "✅ Frontend build exists"
fi

echo ""
echo "🔧 Creating aaPanel site configuration..."

# Create site config for aaPanel
cat > "$SITE_CONF" << EOF
server {
    listen 80;
    server_name $DOMAIN;
    index index.html index.htm index.php;
    root $APP_DIR/frontend/dist;
    
    # Logs
    access_log /www/server/panel/webserver/logs/${DOMAIN}.access.log;
    error_log /www/server/panel/webserver/logs/${DOMAIN}.error.log;
    
    # Frontend React Router support
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Cache control for HTML
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
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
        
        # CORS headers for API
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization, X-Requested-With" always;
        
        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization, X-Requested-With";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain charset=UTF-8";
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        access_log off;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
        try_files \$uri =404;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types 
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml
        application/rss+xml
        application/atom+xml
        image/svg+xml;
    
    # Security: Block access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ \.(env|log|conf)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Disable access to node_modules
    location ~ /node_modules/ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

echo "✅ Site configuration created: $SITE_CONF"

# Update main nginx config to include vhost
MAIN_CONF="$AAPANEL_NGINX_CONF/nginx.conf"
if [ -f "$MAIN_CONF" ]; then
    # Check if include vhost already exists
    if ! grep -q "include.*vhost.*\.conf" "$MAIN_CONF"; then
        echo "🔧 Adding vhost include to main nginx config..."
        # Add include before the last closing brace
        sed -i '/^}$/i\    include /www/server/panel/webserver/conf/vhost/*.conf;' "$MAIN_CONF"
        echo "✅ Added vhost include to nginx.conf"
    else
        echo "✅ Vhost include already exists in nginx.conf"
    fi
fi

# Test nginx configuration
echo ""
echo "🧪 Testing nginx configuration..."
if "$NGINX_BIN" -t -c "$MAIN_CONF"; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    cat "$SITE_CONF" | head -20
    exit 1
fi

# Reload nginx
echo ""
echo "🔄 Reloading aaPanel nginx..."
if "$NGINX_BIN" -s reload -c "$MAIN_CONF"; then
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Failed to reload nginx"
    echo "🔧 Trying to restart nginx process..."
    pkill -f webserver
    sleep 2
    "$NGINX_BIN" -c "$MAIN_CONF" &
    sleep 3
fi

# Test backend connectivity
echo ""
echo "🧪 Testing backend..."
if curl -f -s http://127.0.0.1:5000/health > /dev/null; then
    echo "✅ Backend is responding"
    echo "Response: $(curl -s http://127.0.0.1:5000/health)"
else
    echo "❌ Backend is not responding"
    echo "🔍 PM2 status:"
    pm2 list
fi

# Test website
echo ""
echo "🧪 Testing website access..."
sleep 3

# Test root
if curl -f -s http://127.0.0.1/ > /dev/null; then
    echo "✅ Website root is accessible"
else
    echo "❌ Website root is not accessible"
    echo "🔍 Checking nginx process..."
    ps aux | grep webserver | grep -v grep
fi

# Test API
if curl -f -s http://127.0.0.1/health > /dev/null; then
    echo "✅ API proxy is working"
    echo "Health: $(curl -s http://127.0.0.1/health)"
else
    echo "❌ API proxy is not working"
fi

echo ""
echo "🎉 aaPanel Nginx setup completed!"
echo "================================="
echo ""
echo "📊 Access Information:"
echo "Website: http://$DOMAIN"
echo "API: http://$DOMAIN/api"
echo "Health: http://$DOMAIN/health"
echo ""
echo "👥 Login Credentials:"
echo "Admin: dinkes / dinkes123"
echo "Puskesmas: cibinong / bogorkab"
echo ""
echo "🔍 Configuration files:"
echo "Site config: $SITE_CONF"
echo "Main config: $MAIN_CONF"
echo "Logs: /www/server/panel/webserver/logs/$DOMAIN.*"
echo ""
echo "🔧 Useful commands:"
echo "Test config: $NGINX_BIN -t -c $MAIN_CONF"
echo "Reload: $NGINX_BIN -s reload -c $MAIN_CONF"
echo "Check processes: ps aux | grep webserver"
echo ""
echo "✅ E-EVKIN Modern should now be accessible at: http://$DOMAIN"