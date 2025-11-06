#!/bin/bash

# Fix aaPanel Nginx Configuration for E-EVKIN Modern
# This script properly configures nginx for aaPanel environment

echo "🔧 Fixing aaPanel Nginx Configuration"
echo "======================================"

# Check if we're on the server
if [ ! -d "/www/server" ]; then
    echo "❌ This script must be run on the aaPanel server"
    exit 1
fi

# Find the actual nginx installation
NGINX_BINARY=""
NGINX_CONF=""

# Check common aaPanel nginx locations
if [ -f "/www/server/nginx/sbin/nginx" ]; then
    NGINX_BINARY="/www/server/nginx/sbin/nginx"
    NGINX_CONF="/www/server/nginx/conf/nginx.conf"
    echo "✅ Found standard aaPanel Nginx: $NGINX_BINARY"
elif [ -f "/usr/sbin/nginx" ]; then
    NGINX_BINARY="/usr/sbin/nginx"
    NGINX_CONF="/etc/nginx/nginx.conf"
    echo "✅ Found system Nginx: $NGINX_BINARY"
else
    echo "🔍 Searching for nginx binary..."
    NGINX_BINARY=$(which nginx 2>/dev/null)
    if [ -n "$NGINX_BINARY" ]; then
        echo "✅ Found Nginx: $NGINX_BINARY"
        # Try to find config file
        if [ -f "/etc/nginx/nginx.conf" ]; then
            NGINX_CONF="/etc/nginx/nginx.conf"
        elif [ -f "/usr/local/nginx/conf/nginx.conf" ]; then
            NGINX_CONF="/usr/local/nginx/conf/nginx.conf"
        fi
    else
        echo "❌ Nginx not found! Please install nginx first."
        exit 1
    fi
fi

echo "📍 Nginx binary: $NGINX_BINARY"
echo "📍 Nginx config: $NGINX_CONF"

# Test nginx configuration
echo ""
echo "🧪 Testing current nginx configuration..."
if $NGINX_BINARY -t; then
    echo "✅ Current nginx configuration is valid"
else
    echo "❌ Current nginx configuration has errors"
fi

# Check if sites-available/sites-enabled structure exists
SITES_DIR=""
if [ -d "/etc/nginx/sites-available" ]; then
    SITES_DIR="/etc/nginx/sites-available"
    SITES_ENABLED="/etc/nginx/sites-enabled"
    echo "✅ Using sites-available structure: $SITES_DIR"
elif [ -d "/www/server/nginx/conf/vhost" ]; then
    SITES_DIR="/www/server/nginx/conf/vhost"
    echo "✅ Using aaPanel vhost structure: $SITES_DIR"
else
    # Create in main conf directory
    SITES_DIR="/etc/nginx/conf.d"
    mkdir -p "$SITES_DIR"
    echo "✅ Using conf.d structure: $SITES_DIR"
fi

# Create the site configuration
SITE_CONF="$SITES_DIR/e-evkin-modern.conf"

echo ""
echo "🔧 Creating site configuration: $SITE_CONF"

cat > "$SITE_CONF" << 'EOF'
server {
    listen 80;
    server_name 103.197.189.168;
    
    # Document root for frontend
    root /www/wwwroot/e-evkin-modern/frontend/dist;
    index index.html;

    # Logs
    access_log /var/log/nginx/e-evkin-modern.access.log;
    error_log /var/log/nginx/e-evkin-modern.error.log;

    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Handle React Router (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Deny access to sensitive files
    location ~ /\.(ht|git|env) {
        deny all;
        return 404;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
EOF

echo "✅ Site configuration created"

# Enable site if using sites-enabled structure
if [ -n "$SITES_ENABLED" ] && [ -d "$SITES_ENABLED" ]; then
    echo ""
    echo "🔗 Enabling site..."
    ln -sf "$SITE_CONF" "$SITES_ENABLED/e-evkin-modern.conf"
    echo "✅ Site enabled"
fi

# Test the new configuration
echo ""
echo "🧪 Testing new nginx configuration..."
if $NGINX_BINARY -t; then
    echo "✅ Nginx configuration test passed"
    
    # Reload nginx
    echo ""
    echo "🔄 Reloading nginx..."
    if systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || $NGINX_BINARY -s reload; then
        echo "✅ Nginx reloaded successfully"
    else
        echo "❌ Failed to reload nginx"
        exit 1
    fi
    
    echo ""
    echo "🎉 Setup complete!"
    echo "✅ Website should now be accessible at: http://103.197.189.168"
    echo "✅ API endpoint: http://103.197.189.168/api/"
    echo ""
    echo "🔍 Test the deployment:"
    echo "  Frontend: curl -I http://103.197.189.168"
    echo "  API:      curl http://103.197.189.168/api/health"
    
else
    echo "❌ Nginx configuration test failed"
    echo "Please check the configuration manually:"
    echo "  Config file: $SITE_CONF"
    echo "  Test command: $NGINX_BINARY -t"
    exit 1
fi