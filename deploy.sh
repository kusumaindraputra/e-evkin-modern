#!/bin/bash

# E-EVKIN Modern - Complete Deployment Script for aaPanel Ubuntu Server
# This script handles EVERYTHING from initial setup to production deployment
# 
# Features:
# - First-time setup (dependencies, database, nginx)
# - Regular deployments (git pull, build, restart)
# - Memory optimization for 2GB servers
# - Complete nginx configuration
# - Database setup and seeding
# - PM2 process management
# - Health checks and validation
#
# Usage: 
#   ./deploy.sh --first-time    # First deployment (installs everything)
#   ./deploy.sh                 # Regular deployment (updates only)
#   ./deploy.sh --quick         # Quick deployment (skip deps)

set -e

echo "🚀 E-EVKIN Modern - Complete aaPanel Deployment"
echo "==============================================="

# Variables - aaPanel Ubuntu Server Configuration
APP_DIR="/www/wwwroot/e-evkin-modern"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
LOG_FILE="$APP_DIR/deploy.log"
FIRST_TIME=false
QUICK_DEPLOY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --first-time)
      FIRST_TIME=true
      shift
      ;;
    --quick)
      QUICK_DEPLOY=true
      shift
      ;;
    *)
      echo "Unknown option $1"
      echo "Usage: $0 [--first-time] [--quick]"
      echo "  --first-time : Complete first-time setup (database, nginx, etc.)"
      echo "  --quick      : Quick deployment (skip dependency installation)"
      exit 1
      ;;
  esac
done

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root on aaPanel servers"
   echo "   Please run: sudo bash deploy.sh"
   exit 1
fi

echo "✅ Running with root privileges on aaPanel server..."

# Function to log with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# FIRST TIME SETUP FUNCTIONS
# ==========================

install_system_dependencies() {
    log "📦 Installing system dependencies..."
    apt update
    apt install -y curl wget git build-essential nginx postgresql postgresql-contrib
    log "✅ System dependencies installed"
}

install_nodejs() {
    log "📦 Installing Node.js 18..."
    if ! command_exists node; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt install -y nodejs
    fi
    
    # Install/update npm and PM2
    npm install -g npm@latest pm2@latest
    
    log "✅ Node.js $(node --version) and PM2 installed"
}

setup_database() {
    log "🗄️ Setting up PostgreSQL database..."
    
    # Start PostgreSQL service
    systemctl start postgresql
    systemctl enable postgresql
    
    # Create database and user
    sudo -u postgres psql << EOF
CREATE DATABASE eevkin_modern;
CREATE USER eevkin_user WITH ENCRYPTED PASSWORD 'eevkin_secure_2024';
GRANT ALL PRIVILEGES ON DATABASE eevkin_modern TO eevkin_user;
ALTER USER eevkin_user CREATEDB;
\q
EOF
    
    log "✅ Database setup completed"
}

setup_environment() {
    log "🔧 Setting up environment configuration..."
    
    # Create .env file for backend
    cat > "$BACKEND_DIR/.env" << EOF
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eevkin_modern
DB_USER=eevkin_user
DB_PASSWORD=eevkin_secure_2024
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=http://103.197.189.168
EOF
    
    log "✅ Environment configuration created"
}

seed_database() {
    log "🌱 Seeding database..."
    cd "$BACKEND_DIR"
    
    # Run database migrations and seeding
    npx tsx src/seeders/seedAll.ts
    
    log "✅ Database seeded with initial data"
}

configure_nginx() {
    log "🌐 Configuring Nginx..."
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Create our site configuration
    cat > "/etc/nginx/sites-available/e-evkin-modern" << 'EOF'
server {
    listen 80;
    server_name 103.197.189.168;
    
    root /www/wwwroot/e-evkin-modern/frontend/dist;
    index index.html;

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
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        access_log off;
    }

    # Handle React Router (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
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

    # Performance optimizations
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    client_max_body_size 10M;
    server_tokens off;
}
EOF

    # Enable the site
    ln -sf "/etc/nginx/sites-available/e-evkin-modern" "/etc/nginx/sites-enabled/e-evkin-modern"
    
    # Test and reload nginx
    nginx -t && systemctl reload nginx
    
    log "✅ Nginx configured and reloaded"
}

# DEPLOYMENT FUNCTIONS
# ===================

# Check required tools
log "🔍 Checking system requirements..."

# For first time setup, we'll install missing tools
if [ "$FIRST_TIME" = true ]; then
    log "🎯 First-time setup detected - installing all requirements..."
    
    # Check if app directory exists, create if needed
    if [ ! -d "$APP_DIR" ]; then
        log "📁 Creating application directory: $APP_DIR"
        mkdir -p "$APP_DIR"
        cd "$APP_DIR"
        
        # Clone or initialize git repository
        if [ ! -d ".git" ]; then
            log "📥 Initializing git repository..."
            git init
            # You would typically clone from your repository here
            # git clone https://github.com/kusumaindraputra/e-evkin-modern.git .
        fi
    fi
    
    # Install system dependencies
    install_system_dependencies
    install_nodejs
    setup_database
    setup_environment
    
else
    # Regular deployment - check if tools exist
    required_tools=("git" "node" "npm" "pm2" "nginx")
    for tool in "${required_tools[@]}"; do
        if ! command_exists $tool; then
            echo "❌ Required tool '$tool' is not installed"
            echo "   Run with --first-time flag for initial setup"
            exit 1
        fi
    done
fi

# Ensure we're in the app directory
cd "$APP_DIR"
log "📂 Working directory: $(pwd)"

# Git operations (if not first time)
if [ "$FIRST_TIME" = false ]; then
    log "📥 Updating code from Git..."
    git fetch origin
    git reset --hard origin/$(git branch --show-current)
    log "✅ Code updated"
fi

# Memory-optimized dependency installation
install_dependencies() {
    log "📦 Installing dependencies with memory optimization..."
    
    # Set memory limits for Node.js operations
    export NODE_OPTIONS="--max-old-space-size=1024"
    
    # Root dependencies
    if [ "$QUICK_DEPLOY" = false ]; then
        npm ci --only=production --no-audit --prefer-offline
        log "✅ Root dependencies installed"
    fi
    
    # Backend dependencies
    cd "$BACKEND_DIR"
    if [ "$QUICK_DEPLOY" = false ]; then
        npm ci --no-audit --prefer-offline
        log "✅ Backend dependencies installed"
    fi
    
    # Frontend dependencies  
    cd "$FRONTEND_DIR"
    if [ "$QUICK_DEPLOY" = false ]; then
        npm ci --no-audit --prefer-offline
        log "✅ Frontend dependencies installed"
    fi
}

# Build applications with memory optimization
build_applications() {
    log "🔨 Building applications..."
    
    # Backend build
    cd "$BACKEND_DIR"
    rm -rf dist/
    
    # Memory-optimized TypeScript compilation
    export NODE_OPTIONS="--max-old-space-size=1024"
    if ! npx tsc; then
        log "⚠️ TypeScript compilation failed with 1024MB, trying 768MB..."
        export NODE_OPTIONS="--max-old-space-size=768"
        npx tsc
    fi
    
    if [ ! -f "dist/server.js" ]; then
        log "❌ Backend build failed"
        exit 1
    fi
    log "✅ Backend built successfully"
    
    # Frontend build
    cd "$FRONTEND_DIR"
    rm -rf dist/
    npm run build
    
    if [ ! -f "dist/index.html" ]; then
        log "❌ Frontend build failed"
        exit 1
    fi
    
    BUILD_SIZE=$(du -sh dist/ | cut -f1)
    log "✅ Frontend built successfully (Size: $BUILD_SIZE)"
}

# PM2 process management
manage_backend_process() {
    log "� Managing backend process..."
    cd "$APP_DIR"
    
    # Stop existing process
    pm2 stop e-evkin-backend 2>/dev/null || log "⚠️ Backend was not running"
    
    # Start backend
    pm2 start "$BACKEND_DIR/dist/server.js" --name "e-evkin-backend" \
        --cwd "$BACKEND_DIR" \
        --env "NODE_ENV=production" \
        --max-memory-restart 1500M \
        --node-args="--max-old-space-size=1024"
    
    # Save PM2 configuration
    pm2 save
    
    log "✅ Backend process started with PM2"
}

# Health checks
perform_health_checks() {
    log "🏥 Performing health checks..."
    
    # Wait for backend to start
    sleep 10
    
    # Backend health check
    for i in {1..30}; do
        if curl -f -s http://localhost:5000/health > /dev/null; then
            log "✅ Backend health check passed"
            break
        fi
        
        if [ $i -eq 30 ]; then
            log "❌ Backend health check failed after 30 attempts"
            log "📝 PM2 logs:"
            pm2 logs e-evkin-backend --lines 10 --nostream
            exit 1
        fi
        
        sleep 2
    done
    
    # Nginx check
    if nginx -t 2>/dev/null; then
        log "✅ Nginx configuration is valid"
    else
        log "❌ Nginx configuration has errors"
        exit 1
    fi
    
    # Frontend accessibility check
    if curl -f -s http://localhost/ > /dev/null; then
        log "✅ Frontend is accessible"
    else
        log "⚠️ Frontend accessibility check failed"
    fi
}

# MAIN DEPLOYMENT LOGIC
# ====================

log "🚀 Starting deployment process..."

# Install dependencies
install_dependencies

# Build applications
build_applications

# First-time database setup
if [ "$FIRST_TIME" = true ]; then
    seed_database
    configure_nginx
fi

# Manage backend process
manage_backend_process

# Reload nginx for regular deployments
if [ "$FIRST_TIME" = false ]; then
    log "🔄 Reloading Nginx..."
    nginx -s reload
    log "✅ Nginx reloaded"
fi

# Health checks
perform_health_checks

# Final status and summary
log "📊 Final deployment status..."
pm2 list

# Print comprehensive deployment summary
echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "===================================="
echo "📅 Date: $(date)"
echo "🏠 Directory: $APP_DIR"
echo "🔧 Backend: Running with PM2 on port 5000"
echo "� Frontend: Served by Nginx on port 80" 
echo "�️ Database: PostgreSQL with seeded data"
echo ""
echo "🌐 ACCESS URLS:"
echo "──────────────"
echo "✅ Website: http://103.197.189.168"
echo "✅ API: http://103.197.189.168/api/"
echo "✅ Health: http://103.197.189.168/health"
echo ""
echo "🔐 LOGIN CREDENTIALS:"
echo "────────────────────"
echo "👨‍💼 Admin: dinkes / dinkes123"
echo "🏥 Puskesmas: cibinong / bogorkab"
echo ""
echo "📊 MONITORING COMMANDS:"
echo "──────────────────────"
echo "� PM2 Status: pm2 status"
echo "📝 Backend Logs: pm2 logs e-evkin-backend"
echo "� Nginx Status: systemctl status nginx"
echo "�️ DB Status: systemctl status postgresql"
echo ""
echo "🔧 MAINTENANCE COMMANDS:"
echo "───────────────────────"
echo "🔄 Regular Deploy: bash deploy.sh"
echo "⚡ Quick Deploy: bash deploy.sh --quick"
echo "🆕 Fresh Setup: bash deploy.sh --first-time"
echo ""

if [ "$FIRST_TIME" = true ]; then
    echo "🚀 FIRST-TIME SETUP COMPLETED!"
    echo "✅ All services installed and configured"
    echo "✅ Database created and seeded"
    echo "✅ Nginx configured for production"
    echo "✅ PM2 process management enabled"
    echo "✅ Application fully functional"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Visit http://103.197.189.168 to test the application"
    echo "2. Login with the credentials above"
    echo "3. Verify all features work correctly"
    echo "4. Set up SSL certificate if needed"
    echo "5. Configure domain name if applicable"
else
    echo "🔄 REGULAR DEPLOYMENT COMPLETED!"
    echo "✅ Code updated and applications rebuilt"
    echo "✅ Services restarted and health checked"
    echo "✅ Application updated successfully"
fi

echo ""
echo "📞 SUPPORT:"
echo "──────────"
echo "📊 Health Check: curl http://103.197.189.168/health"
echo "🔍 Quick Test: curl -I http://103.197.189.168"
echo "📝 View Logs: tail -f $LOG_FILE"
echo ""
echo "🎊 Happy coding! Your E-EVKIN Modern app is ready!"
