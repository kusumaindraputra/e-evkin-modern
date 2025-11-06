#!/bin/bash
# E-EVKIN Modern - Health Check Script

echo "🏥 E-EVKIN Modern - System Health Check"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_service() {
    if systemctl is-active --quiet $1; then
        echo -e "${GREEN}✓${NC} $1 is running"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not running"
        return 1
    fi
}

check_port() {
    if netstat -tuln | grep -q ":$1 "; then
        echo -e "${GREEN}✓${NC} Port $1 is open"
        return 0
    else
        echo -e "${RED}✗${NC} Port $1 is not open"
        return 1
    fi
}

check_disk() {
    usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$usage" -lt 80 ]; then
        echo -e "${GREEN}✓${NC} Disk usage: $usage%"
        return 0
    elif [ "$usage" -lt 90 ]; then
        echo -e "${YELLOW}⚠${NC} Disk usage: $usage% (Warning)"
        return 0
    else
        echo -e "${RED}✗${NC} Disk usage: $usage% (Critical)"
        return 1
    fi
}

check_memory() {
    usage=$(free | awk 'NR==2 {printf "%.0f", $3/$2*100}')
    if [ "$usage" -lt 80 ]; then
        echo -e "${GREEN}✓${NC} Memory usage: $usage%"
        return 0
    elif [ "$usage" -lt 90 ]; then
        echo -e "${YELLOW}⚠${NC} Memory usage: $usage% (Warning)"
        return 0
    else
        echo -e "${RED}✗${NC} Memory usage: $usage% (Critical)"
        return 1
    fi
}

# System checks
echo "System Resources:"
check_disk
check_memory
echo ""

# Service checks
echo "Services:"
check_service nginx
check_service postgresql
echo ""

# Port checks
echo "Ports:"
check_port 80    # Nginx HTTP
check_port 5000  # Backend API
check_port 5432  # PostgreSQL
echo ""

# PM2 checks
echo "PM2 Processes:"
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "online"; then
        echo -e "${GREEN}✓${NC} PM2 processes running"
        pm2 list
    else
        echo -e "${RED}✗${NC} No PM2 processes online"
    fi
else
    echo -e "${RED}✗${NC} PM2 not installed"
fi
echo ""

# Database check
echo "Database:"
if PGPASSWORD=$DB_PASSWORD psql -U evkin_user -d e_evkin_staging -h localhost -c "SELECT 1;" &> /dev/null; then
    echo -e "${GREEN}✓${NC} Database connection successful"
else
    echo -e "${RED}✗${NC} Database connection failed"
fi
echo ""

# Backend API check
echo "Backend API:"
if curl -s http://localhost:5000/api/health &> /dev/null; then
    echo -e "${GREEN}✓${NC} Backend API responding"
else
    echo -e "${YELLOW}⚠${NC} Backend API not responding (might not have health endpoint)"
fi
echo ""

# Frontend check
echo "Frontend:"
if [ -f "/var/www/e-evkin-modern/frontend/dist/index.html" ]; then
    echo -e "${GREEN}✓${NC} Frontend build exists"
else
    echo -e "${RED}✗${NC} Frontend build not found"
fi
echo ""

echo "========================================"
echo "Health check completed!"
