#!/bin/bash

# Install and Configure Nginx for aaPanel E-EVKIN Modern
# This script installs nginx and sets up the site configuration

echo "🌐 Installing and Configuring Nginx for E-EVKIN Modern"
echo "====================================================="

# Check if we're on the server
if [ ! -d "/www/wwwroot" ]; then
    echo "❌ This script must be run on the aaPanel server"
    exit 1
fi

# Update package list
echo "📦 Updating package list..."
apt update

# Install nginx
echo "🔧 Installing nginx..."
if command -v nginx >/dev/null 2>&1; then
    echo "✅ Nginx is already installed"
else
    apt install -y nginx
    if [ $? -eq 0 ]; then
        echo "✅ Nginx installed successfully"
    else
        echo "❌ Failed to install nginx"
        exit 1
    fi
fi

# Enable and start nginx
echo "🚀 Starting nginx service..."
systemctl enable nginx
systemctl start nginx

# Check nginx status
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx failed to start"
    systemctl status nginx
    exit 1
fi

# Create log directory if it doesn't exist
mkdir -p /var/log/nginx

# Remove default site
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "🗑️ Removing default nginx site..."
    rm -f /etc/nginx/sites-enabled/default
fi

# Create our site configuration
SITE_CONF="/etc/nginx/sites-available/e-evkin-modern"
echo "📝 Creating site configuration: $SITE_CONF"

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

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

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
        
        # Optimized timeouts for 2GB server
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        access_log off;
    }

    # Handle React Router (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
        
        # HTML files - no cache for staging
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
        }
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
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
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        application/xml
        image/svg+xml;

    # Security and performance optimizations
    client_max_body_size 10M;
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout 30;
    send_timeout 10;
    server_tokens off;
}
EOF

# Enable the site
echo "🔗 Enabling site..."
ln -sf "/etc/nginx/sites-available/e-evkin-modern" "/etc/nginx/sites-enabled/e-evkin-modern"

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration test passed"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

# Reload nginx
echo "🔄 Reloading nginx..."
systemctl reload nginx

if [ $? -eq 0 ]; then
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Failed to reload nginx"
    exit 1
fi

# Check if frontend build exists
if [ -f "/www/wwwroot/e-evkin-modern/frontend/dist/index.html" ]; then
    echo "✅ Frontend build found"
else
    echo "⚠️ Frontend build not found at /www/wwwroot/e-evkin-modern/frontend/dist/"
    echo "   You may need to run: cd /www/wwwroot/e-evkin-modern/frontend && npm run build"
fi

# Test the deployment
echo ""
echo "🎉 Nginx setup complete!"
echo "============================="
echo "✅ Website: http://103.197.189.168"
echo "✅ API: http://103.197.189.168/api/"
echo "✅ Health: http://103.197.189.168/health"
echo ""
echo "🔍 Quick tests:"
echo "  curl -I http://localhost"
echo "  curl http://localhost/health"
echo ""
echo "📊 Nginx status:"
systemctl status nginx --no-pager -l

echo ""
echo "📝 Configuration files:"
echo "  Site config: /etc/nginx/sites-available/e-evkin-modern"
echo "  Enabled: /etc/nginx/sites-enabled/e-evkin-modern"
echo "  Logs: /var/log/nginx/e-evkin-modern.*"