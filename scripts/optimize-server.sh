#!/bin/bash

# E-EVKIN Modern - Server Optimization Script for 2GB RAM Ubuntu + aaPanel
# Run this script after deployment to optimize server performance

set -e

echo "🔧 E-EVKIN Modern - Server Optimization for 2GB RAM"
echo "=================================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)"
   exit 1
fi

# Variables
APP_DIR="/www/wwwroot/e-evkin-modern"

echo "📊 Current Memory Status:"
free -h

# 1. Create swap file if not exists
echo "💾 Setting up swap file..."
if ! swapon --show | grep -q '/swapfile'; then
    echo "Creating 1GB swap file..."
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    
    # Make permanent
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    echo "✅ Swap file created and activated"
else
    echo "✅ Swap file already exists"
fi

# 2. Optimize PostgreSQL for 2GB RAM
echo "🗄️ Optimizing PostgreSQL configuration..."
PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+\.\d+' | head -1)
PG_CONF="/etc/postgresql/$PG_VERSION/main/postgresql.conf"

if [ -f "$PG_CONF" ]; then
    cp "$PG_CONF" "$PG_CONF.backup.$(date +%Y%m%d)"
    
    # Apply optimizations
    sed -i "s/#shared_buffers = 128MB/shared_buffers = 256MB/" "$PG_CONF"
    sed -i "s/#effective_cache_size = 4GB/effective_cache_size = 1GB/" "$PG_CONF"
    sed -i "s/#maintenance_work_mem = 64MB/maintenance_work_mem = 64MB/" "$PG_CONF"
    sed -i "s/#work_mem = 4MB/work_mem = 4MB/" "$PG_CONF"
    sed -i "s/#max_connections = 100/max_connections = 20/" "$PG_CONF"
    sed -i "s/#checkpoint_completion_target = 0.5/checkpoint_completion_target = 0.9/" "$PG_CONF"
    sed -i "s/#wal_buffers = -1/wal_buffers = 16MB/" "$PG_CONF"
    
    echo "✅ PostgreSQL configuration optimized"
    
    # Restart PostgreSQL
    systemctl restart postgresql
    echo "✅ PostgreSQL restarted"
else
    echo "⚠️ PostgreSQL config file not found at $PG_CONF"
fi

# 3. Optimize Nginx for low memory
echo "🌐 Optimizing Nginx configuration..."
NGINX_CONF="/etc/nginx/nginx.conf"

if [ -f "$NGINX_CONF" ]; then
    cp "$NGINX_CONF" "$NGINX_CONF.backup.$(date +%Y%m%d)"
    
    # Create optimized nginx.conf if not already optimized
    if ! grep -q "worker_processes auto" "$NGINX_CONF"; then
        cat > "$NGINX_CONF" << 'EOF'
user www-data;
worker_processes auto;
worker_rlimit_nofile 1024;

events {
    worker_connections 512;
    use epoll;
    multi_accept on;
}

http {
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 30;
    types_hash_max_size 2048;
    server_tokens off;
    
    # Memory optimization
    client_body_buffer_size 16K;
    client_header_buffer_size 1k;
    client_max_body_size 10m;
    large_client_header_buffers 2 1k;
    
    # Timeouts (optimized for 2GB server)
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;
    
    # MIME types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging (reduced for performance)
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # Include sites
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF
        echo "✅ Nginx configuration optimized"
        
        # Test and reload nginx
        nginx -t && systemctl reload nginx
        echo "✅ Nginx reloaded"
    else
        echo "✅ Nginx already optimized"
    fi
else
    echo "⚠️ Nginx config file not found"
fi

# 4. System-level optimizations
echo "⚙️ Applying system optimizations..."

# Update sysctl for better performance
cat > /etc/sysctl.d/99-e-evkin-optimize.conf << 'EOF'
# Network optimizations
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# Memory management
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# File handling
fs.file-max = 65536
EOF

sysctl -p /etc/sysctl.d/99-e-evkin-optimize.conf
echo "✅ System parameters optimized"

# 5. PM2 optimization
echo "🚀 Optimizing PM2 configuration..."
if command -v pm2 > /dev/null; then
    # Set PM2 log rotation
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 7
    pm2 set pm2-logrotate:compress true
    echo "✅ PM2 log rotation configured"
    
    # Update PM2 startup script
    pm2 startup | tail -1 | bash
    echo "✅ PM2 startup configured"
else
    echo "⚠️ PM2 not found"
fi

# 6. Set up log rotation for application logs
echo "📝 Setting up log rotation..."
cat > /etc/logrotate.d/e-evkin-modern << 'EOF'
/www/wwwroot/e-evkin-modern/backend/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
echo "✅ Log rotation configured"

# 7. Create monitoring script
echo "📊 Creating monitoring script..."
cat > /usr/local/bin/e-evkin-monitor << 'EOF'
#!/bin/bash

echo "E-EVKIN Modern - Server Status Monitor"
echo "======================================"

echo "📊 Memory Usage:"
free -h

echo ""
echo "💾 Disk Usage:"
df -h /

echo ""
echo "🚀 PM2 Status:"
pm2 status

echo ""
echo "🌐 Nginx Status:"
systemctl status nginx --no-pager -l

echo ""
echo "🗄️ PostgreSQL Status:"
systemctl status postgresql --no-pager -l

echo ""
echo "🔗 Application Health:"
curl -s http://localhost:5000/health | jq . 2>/dev/null || echo "Health check failed"

echo ""
echo "📈 System Load:"
uptime
EOF

chmod +x /usr/local/bin/e-evkin-monitor
echo "✅ Monitoring script created at /usr/local/bin/e-evkin-monitor"

# 8. Final memory status
echo ""
echo "📊 Final Memory Status:"
free -h

echo ""
echo "✅ Server optimization completed!"
echo ""
echo "📋 What was optimized:"
echo "   - 1GB Swap file created"
echo "   - PostgreSQL optimized for 2GB RAM"
echo "   - Nginx optimized for low memory"
echo "   - System parameters tuned"
echo "   - PM2 log rotation configured"
echo "   - Application log rotation set up"
echo "   - Monitoring script created"
echo ""
echo "🔧 Next steps:"
echo "   1. Restart the server: sudo reboot"
echo "   2. Monitor status: /usr/local/bin/e-evkin-monitor"
echo "   3. Deploy application: cd $APP_DIR && ./deploy.sh"
echo ""
echo "⚠️ Remember to:"
echo "   - Configure your domain in nginx"
echo "   - Update CORS_ORIGIN in .env"
echo "   - Change default passwords"
echo "   - Set up SSL certificate"