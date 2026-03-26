#!/bin/bash
# Setup PM2 log rotation and system logrotate for e-evkin
set -euo pipefail

echo "=== Setting up PM2 log rotation ==="
pm2 install pm2-logrotate 2>/dev/null || true
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:workerInterval 30
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
echo "PM2 log rotation configured: 10MB max, 7 files retained, compressed"

echo ""
echo "=== Setting up nginx log rotation ==="
cat > /etc/logrotate.d/e-evkin-nginx << 'EOF'
/var/log/nginx/access.log
/var/log/nginx/error.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 $(cat /var/run/nginx.pid)
    endscript
}
EOF
echo "Nginx log rotation configured: daily, 14 days retained"

echo ""
echo "=== Done ==="
