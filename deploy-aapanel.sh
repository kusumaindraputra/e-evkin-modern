#!/bin/bash

# E-EVKIN Modern - aaPanel Optimized Deploy Script
# Simplified deployment script for aaPanel Ubuntu servers
# 
# Usage: ./deploy-aapanel.sh [--production]

set -e

echo "🚀 E-EVKIN Modern - aaPanel Deployment"
echo "======================================"

# Variables for aaPanel
APP_DIR="/www/wwwroot/e-evkin-modern"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
LOG_FILE="$APP_DIR/deploy.log"
IS_PRODUCTION=false

# Parse arguments
if [[ "$1" == "--production" ]]; then
    IS_PRODUCTION=true
    echo "🎯 Production deployment mode"
fi

# Function to log with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Check if we're in the right directory or navigate to it
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Application directory $APP_DIR does not exist"
    echo "Please ensure the application is uploaded to aaPanel first"
    exit 1
fi

cd $APP_DIR
log "📂 Working directory: $(pwd)"

# Show current user info (helpful for debugging)
log "👤 Running as user: $(whoami)"
log "🔑 User ID: $(id)"

# Check required tools
log "🔍 Checking required tools..."
required_tools=("node" "npm")
for tool in "${required_tools[@]}"; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "❌ Required tool '$tool' is not installed"
        echo "Please install via aaPanel Package Manager"
        exit 1
    fi
done

# Check PM2
if ! command -v pm2 >/dev/null 2>&1; then
    log "📦 Installing PM2 globally..."
    npm install -g pm2
fi

log "✅ All tools available"

# Git pull (if git available)
if command -v git >/dev/null 2>&1; then
    log "📥 Pulling latest changes..."
    git fetch origin 2>/dev/null || log "⚠️  Git fetch failed, continuing..."
    git reset --hard origin/$(git branch --show-current) 2>/dev/null || log "⚠️  Git reset failed, continuing..."
else
    log "⚠️  Git not available, skipping pull (manual upload required)"
fi

# Backend setup
log "🔧 Setting up backend..."
cd $BACKEND_DIR

# Install backend dependencies
log "📦 Installing backend dependencies..."
npm install

# Build backend
log "🔨 Building backend..."
rm -rf dist/
npx tsc

if [ ! -f "dist/server.js" ]; then
    log "❌ Backend build failed"
    exit 1
fi

log "✅ Backend built successfully"

# Frontend setup
log "🎨 Setting up frontend..."
cd $FRONTEND_DIR

# Install frontend dependencies
log "📦 Installing frontend dependencies..."
npm install

# Build frontend
log "🔨 Building frontend..."
rm -rf dist/
npm run build

if [ ! -f "dist/index.html" ]; then
    log "❌ Frontend build failed"
    exit 1
fi

BUILD_SIZE=$(du -sh dist/ | cut -f1)
log "✅ Frontend built successfully (Size: $BUILD_SIZE)"

# PM2 process management
log "🔄 Managing PM2 processes..."
cd $APP_DIR

# Stop existing process
pm2 stop e-evkin-backend 2>/dev/null || log "⚠️  No existing process to stop"

# Start backend with PM2
if [ -f "config/ecosystem.config.js" ]; then
    pm2 start config/ecosystem.config.js
else
    # Fallback PM2 start
    cd $BACKEND_DIR
    pm2 start dist/server.js --name e-evkin-backend
    cd $APP_DIR
fi

# Wait and health check
log "⏳ Waiting for backend to start..."
sleep 5

BACKEND_URL="http://localhost:5000/health"
for i in {1..5}; do
    if curl -f -s $BACKEND_URL > /dev/null 2>&1; then
        log "✅ Backend health check passed"
        break
    else
        log "⏳ Health check attempt $i/5..."
        sleep 2
    fi
    
    if [ $i -eq 5 ]; then
        log "❌ Backend health check failed after 5 attempts"
        log "📝 PM2 status:"
        pm2 list
        log "📝 PM2 logs:"
        pm2 logs e-evkin-backend --lines 10 --nostream
        exit 1
    fi
done

# Save PM2 config
pm2 save

# Nginx reload (aaPanel managed)
log "🔄 Nginx management..."
if command -v nginx >/dev/null 2>&1; then
    # Try to reload nginx
    if nginx -t 2>/dev/null; then
        nginx -s reload 2>/dev/null && log "✅ Nginx reloaded" || log "⚠️  Manual nginx reload required via aaPanel"
    else
        log "⚠️  Nginx config test failed, check via aaPanel"
    fi
else
    log "✅ Nginx managed by aaPanel, no manual reload needed"
fi

# Environment check for production
if [ "$IS_PRODUCTION" = true ]; then
    log "🔍 Production environment verification..."
    
    # Check critical environment variables
    cd $BACKEND_DIR
    if [ -f ".env" ]; then
        if grep -q "your-super-secret-jwt-key" .env; then
            log "⚠️  WARNING: Default JWT_SECRET detected!"
            log "   Please update JWT_SECRET before production use"
        fi
        
        if grep -q "localhost" .env; then
            log "⚠️  WARNING: Development URLs detected in .env"
            log "   Please update for production environment"
        fi
    else
        log "⚠️  WARNING: No .env file found"
        log "   Please create .env file with production settings"
    fi
fi

# Final status
log "📊 Deployment completed!"
log "=============================="
log "📅 Date: $(date)"
log "🏠 Directory: $APP_DIR"
log "🔧 Backend: Running with PM2"
log "🎨 Frontend: Built and ready"
log "🔗 Health: $BACKEND_URL"

echo ""
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo ""
echo "🔍 Quick checks:"
echo "- PM2 status: pm2 list"
echo "- Backend logs: pm2 logs e-evkin-backend"
echo "- Backend health: curl $BACKEND_URL"
echo "- Frontend: Check your domain in browser"
echo ""

if [ "$IS_PRODUCTION" = true ]; then
    echo "🚀 PRODUCTION DEPLOYMENT"
    echo "⚠️  Don't forget to:"
    echo "   1. Verify environment variables in backend/.env"
    echo "   2. Check SSL certificate in aaPanel"
    echo "   3. Test all application functions"
    echo "   4. Monitor logs for any issues"
else
    echo "🧪 STAGING DEPLOYMENT"
    echo "✅ Ready for testing"
fi

echo ""
echo "📚 Documentation:"
echo "- Deployment guide: docs/deployment/DEPLOYMENT_UBUNTU_AAPANEL.md"
echo "- Security guide: docs/security/SECURITY.md"
echo "- Environment setup: ./setup-production-env.sh"

log "🎉 Deployment script completed successfully!"