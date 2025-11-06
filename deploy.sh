#!/bin/bash

# E-EVKIN Modern - Comprehensive Deploy Script for Staging/Production
# Run this script on your staging/production server
# 
# This script handles:
# - Git pull latest changes
# - Root and backend dependencies installation
# - Frontend dependencies installation
# - TypeScript compilation for backend
# - Frontend production build
# - PM2 process management
# - Nginx reload
# - Health checks
#
# Usage: ./deploy.sh [--skip-deps] [--skip-build] [--production]

set -e

echo "🚀 E-EVKIN Modern - Comprehensive Deployment"
echo "============================================="

# Variables - Updated for aaPanel Ubuntu server
APP_DIR="/www/wwwroot/e-evkin-modern"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
LOG_FILE="$APP_DIR/deploy.log"
SKIP_DEPS=false
SKIP_BUILD=false
IS_PRODUCTION=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-deps)
      SKIP_DEPS=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --production)
      IS_PRODUCTION=true
      shift
      ;;
    *)
      echo "Unknown option $1"
      echo "Usage: $0 [--skip-deps] [--skip-build] [--production]"
      exit 1
      ;;
  esac
done

# Check if running as root - Warning but allow for aaPanel
if [[ $EUID -eq 0 ]]; then
   echo "⚠️  WARNING: Running as root user"
   echo "   This is generally not recommended for security reasons"
   echo "   On aaPanel servers, this might be necessary"
   read -p "Continue anyway? (y/N): " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       echo "❌ Deployment cancelled"
       exit 1
   fi
   echo "✅ Continuing with root privileges..."
fi

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Application directory $APP_DIR does not exist"
    exit 1
fi

# Function to log with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required tools
log "🔍 Checking required tools..."
required_tools=("git" "node" "npm" "pm2")
for tool in "${required_tools[@]}"; do
    if ! command_exists $tool; then
        echo "❌ Required tool '$tool' is not installed"
        exit 1
    fi
done

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_NODE_VERSION="18.0.0"
if ! command_exists npx; then
    echo "❌ npx is not available"
    exit 1
fi

log "✅ Node.js version: $NODE_VERSION"

# Navigate to app directory
cd $APP_DIR
log "📂 Working directory: $(pwd)"

# Backup current deployment (production only)
if [ "$IS_PRODUCTION" = true ]; then
    log "💾 Creating backup..."
    BACKUP_DIR="$APP_DIR/backups/$(date +'%Y%m%d_%H%M%S')"
    mkdir -p $BACKUP_DIR
    cp -r $BACKEND_DIR/dist $BACKUP_DIR/backend_dist 2>/dev/null || true
    cp -r $FRONTEND_DIR/dist $BACKUP_DIR/frontend_dist 2>/dev/null || true
    log "✅ Backup created at: $BACKUP_DIR"
fi

# Pull latest changes
log "📥 Pulling latest changes from Git..."
git fetch origin
git reset --hard origin/$(git branch --show-current)
log "✅ Git pull completed"

# Install/update root dependencies
if [ "$SKIP_DEPS" = false ]; then
    log "📦 Installing root dependencies..."
    npm ci --only=production
    log "✅ Root dependencies installed"

    # Install backend dependencies
    log "📦 Installing backend dependencies..."
    cd $BACKEND_DIR
    
    # Clear npm cache if needed
    npm cache verify
    
    # Install dependencies (use ci for production, install for development)
    if [ "$IS_PRODUCTION" = true ]; then
        npm ci --only=production
    else
        npm install
    fi
    
    # Install dev dependencies needed for build
    npm install --only=dev
    log "✅ Backend dependencies installed"

    # Install frontend dependencies
    log "📦 Installing frontend dependencies..."
    cd $FRONTEND_DIR
    
    # Clear npm cache if needed
    npm cache verify
    
    # Install dependencies
    if [ "$IS_PRODUCTION" = true ]; then
        npm ci --only=production
    else
        npm install
    fi
    
    # Install dev dependencies needed for build (Vite, TypeScript, etc.)
    npm install --only=dev
    log "✅ Frontend dependencies installed"
else
    log "⏭️  Skipping dependency installation"
fi

# Build backend
if [ "$SKIP_BUILD" = false ]; then
    log "🔨 Building backend..."
    cd $BACKEND_DIR
    
    # Clean previous build
    rm -rf dist/
    
    # TypeScript compilation
    npx tsc
    
    # Verify build output
    if [ ! -f "dist/server.js" ]; then
        log "❌ Backend build failed - server.js not found"
        exit 1
    fi
    
    log "✅ Backend build completed"

    # Build frontend
    log "🎨 Building frontend..."
    cd $FRONTEND_DIR
    
    # Clean previous build
    rm -rf dist/
    
    # Vite production build
    npm run build
    
    # Verify build output
    if [ ! -f "dist/index.html" ]; then
        log "❌ Frontend build failed - index.html not found"
        exit 1
    fi
    
    # Check build size
    BUILD_SIZE=$(du -sh dist/ | cut -f1)
    log "✅ Frontend build completed (Size: $BUILD_SIZE)"
else
    log "⏭️  Skipping build process"
fi

# Stop backend gracefully
log "🛑 Stopping backend process..."
cd $APP_DIR
pm2 stop e-evkin-backend 2>/dev/null || log "⚠️  Backend was not running"

# Start/restart backend with PM2
log "🔄 Starting backend with PM2..."
pm2 start config/ecosystem.config.js

# Wait for backend to start
log "⏳ Waiting for backend to start..."
sleep 5

# Health check
log "🏥 Performing health check..."
BACKEND_URL="http://localhost:5000/health"
if curl -f -s $BACKEND_URL > /dev/null; then
    log "✅ Backend health check passed"
else
    log "❌ Backend health check failed"
    log "📝 PM2 logs:"
    pm2 logs e-evkin-backend --lines 10 --nostream
    exit 1
fi

# Reload Nginx if available
if command_exists nginx; then
    # Check if we're root or need sudo
    if [[ $EUID -eq 0 ]]; then
        # Running as root, no sudo needed
        if nginx -t 2>/dev/null; then
            log "🔄 Reloading Nginx..."
            nginx -s reload
            log "✅ Nginx reloaded"
        else
            log "⚠️  Nginx configuration test failed, skipping reload"
        fi
    else
        # Not root, use sudo
        if sudo nginx -t 2>/dev/null; then
            log "🔄 Reloading Nginx..."
            sudo nginx -s reload
            log "✅ Nginx reloaded"
        else
            log "⚠️  Nginx configuration test failed, skipping reload"
        fi
    fi
else
    log "⚠️  Nginx not found, skipping reload"
fi

# Save PM2 configuration
pm2 save

# Final status check
log "📊 Final status check..."
pm2 list
log "✅ Deployment completed successfully!"
log "📊 Check detailed status: pm2 status"
log "📝 View logs: pm2 logs e-evkin-backend"
log "🌐 Frontend: Check your domain"
log "🔗 API Health: curl http://localhost:5000/health"

# Print deployment summary
echo ""
echo "� DEPLOYMENT SUMMARY"
echo "===================="
echo "📅 Date: $(date)"
echo "🏠 Directory: $APP_DIR"
echo "🔧 Backend: Built and running with PM2"
echo "🎨 Frontend: Built and ready to serve"
echo "🔗 Backend Health: $BACKEND_URL"
echo "📊 PM2 Status: pm2 status"
echo ""

if [ "$IS_PRODUCTION" = true ]; then
    echo "🚀 PRODUCTION DEPLOYMENT COMPLETED"
    echo "⚠️  Remember to:"
    echo "   - Monitor logs: pm2 logs e-evkin-backend"
    echo "   - Check application functionality"
    echo "   - Verify SSL certificates if applicable"
    echo "   - Update DNS if needed"
else
    echo "🧪 STAGING DEPLOYMENT COMPLETED"
    echo "✅ Ready for testing"
fi
