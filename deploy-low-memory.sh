#!/bin/bash

# E-EVKIN Modern - Low Memory Deploy Script for 2GB RAM Servers
# Optimized deployment script for memory-constrained servers
# 
# Usage: ./deploy-low-memory.sh [--production]

set -e

echo "🚀 E-EVKIN Modern - Low Memory Deployment"
echo "========================================"
echo "💾 Optimized for 2GB RAM servers"

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

# Function to free memory
free_memory() {
    log "🧹 Clearing memory and caches..."
    # Clear npm cache
    npm cache clean --force 2>/dev/null || true
    # Clear node modules to free memory
    sync
    echo 1 > /proc/sys/vm/drop_caches 2>/dev/null || true
}

# Function to check available memory
check_memory() {
    local available_mb=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    log "💾 Available memory: ${available_mb}MB"
    
    if [ "$available_mb" -lt 500 ]; then
        log "⚠️  WARNING: Low memory available (${available_mb}MB)"
        log "🧹 Attempting to free memory..."
        free_memory
        sleep 2
    fi
}

# Check if we're in the right directory
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Application directory $APP_DIR does not exist"
    exit 1
fi

cd $APP_DIR
log "📂 Working directory: $(pwd)"

# Show system info
log "💻 System info:"
log "   Memory: $(free -h | awk 'NR==2{print $2 " total, " $7 " available"}')"
log "   CPU: $(nproc) cores"
log "   User: $(whoami)"

# Check required tools
log "🔍 Checking required tools..."
required_tools=("node" "npm")
for tool in "${required_tools[@]}"; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "❌ Required tool '$tool' is not installed"
        exit 1
    fi
done

# Check PM2
if ! command -v pm2 >/dev/null 2>&1; then
    log "📦 Installing PM2 globally..."
    export NODE_OPTIONS="--max-old-space-size=256"
    npm install -g pm2
fi

# Set memory limits globally
export NODE_OPTIONS="--max-old-space-size=512"
log "⚡ Set Node.js memory limit: 512MB"

check_memory

# Git pull (if available)
if command -v git >/dev/null 2>&1; then
    log "📥 Pulling latest changes..."
    git fetch origin 2>/dev/null || log "⚠️  Git fetch failed"
    git reset --hard origin/$(git branch --show-current) 2>/dev/null || log "⚠️  Git reset failed"
fi

# Stop PM2 processes first to free memory
log "🛑 Stopping existing processes to free memory..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

check_memory

# Backend setup with memory optimization
log "🔧 Setting up backend with memory optimization..."
cd $BACKEND_DIR

# Remove old builds and node_modules to free space
log "🧹 Cleaning old builds..."
rm -rf dist/ node_modules/ package-lock.json

check_memory

# Install only production dependencies first
log "📦 Installing backend production dependencies..."
export NODE_OPTIONS="--max-old-space-size=384"
npm install --only=production --no-audit --no-fund

check_memory

# Install minimal dev dependencies for TypeScript
log "📦 Installing minimal TypeScript dependencies..."
npm install typescript @types/node --save-dev --no-audit --no-fund

check_memory

# Build backend with minimal memory
log "🔨 Building backend with memory constraints..."
export NODE_OPTIONS="--max-old-space-size=768"

# Create minimal tsconfig for build
cat > tsconfig.build.json << 'EOF'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "sourceMap": false,
    "declaration": false,
    "removeComments": true,
    "incremental": false
  },
  "exclude": ["**/*.test.ts", "**/*.spec.ts", "src/__tests__"]
}
EOF

# Try TypeScript compilation
if ! npx tsc -p tsconfig.build.json; then
    log "❌ TypeScript compilation failed"
    log "💡 Trying with even smaller memory..."
    export NODE_OPTIONS="--max-old-space-size=512"
    npx tsc -p tsconfig.build.json || {
        log "❌ Backend build failed completely"
        exit 1
    }
fi

# Verify build
if [ ! -f "dist/server.js" ]; then
    log "❌ Backend build verification failed"
    exit 1
fi

log "✅ Backend built successfully"
rm -f tsconfig.build.json

check_memory

# Frontend setup with memory optimization
log "🎨 Setting up frontend with memory optimization..."
cd $FRONTEND_DIR

# Clean frontend
log "🧹 Cleaning frontend..."
rm -rf dist/ node_modules/ package-lock.json

check_memory

# Install frontend dependencies with memory limit
log "📦 Installing frontend dependencies..."
export NODE_OPTIONS="--max-old-space-size=384"
npm install --only=production --no-audit --no-fund

# Install minimal dev dependencies for Vite
log "📦 Installing Vite build dependencies..."
npm install vite @vitejs/plugin-react typescript --save-dev --no-audit --no-fund

check_memory

# Build frontend with memory optimization
log "🔨 Building frontend with memory constraints..."
export NODE_OPTIONS="--max-old-space-size=1024"

# Try frontend build
if ! npm run build; then
    log "❌ Frontend build failed"
    log "💡 Trying with smaller memory..."
    export NODE_OPTIONS="--max-old-space-size=768"
    npm run build || {
        log "❌ Frontend build failed completely"
        exit 1
    }
fi

# Verify build
if [ ! -f "dist/index.html" ]; then
    log "❌ Frontend build verification failed"
    exit 1
fi

BUILD_SIZE=$(du -sh dist/ | cut -f1)
log "✅ Frontend built successfully (Size: $BUILD_SIZE)"

check_memory

# Clean up after build to free memory
log "🧹 Post-build cleanup..."
cd $BACKEND_DIR
rm -rf node_modules/@types
cd $FRONTEND_DIR  
rm -rf node_modules/typescript node_modules/vite

check_memory

# Start PM2 with memory optimization
log "🔄 Starting PM2 with memory optimization..."
cd $APP_DIR

# Create optimized PM2 config for low memory
cat > ecosystem.low-memory.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'e-evkin-backend',
    cwd: './backend',
    script: 'dist/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      NODE_OPTIONS: '--max-old-space-size=384'
    },
    max_memory_restart: '400M',
    min_uptime: '10s',
    max_restarts: 3,
    restart_delay: 5000,
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    watch: false
  }]
}
EOF

# Start with optimized config
pm2 start ecosystem.low-memory.config.js

# Wait and health check
log "⏳ Waiting for backend to start..."
sleep 8

BACKEND_URL="http://localhost:5000/health"
for i in {1..5}; do
    if curl -f -s $BACKEND_URL > /dev/null 2>&1; then
        log "✅ Backend health check passed"
        break
    else
        log "⏳ Health check attempt $i/5..."
        sleep 3
    fi
    
    if [ $i -eq 5 ]; then
        log "❌ Backend health check failed"
        log "📝 PM2 status:"
        pm2 list
        log "📝 PM2 logs:"
        pm2 logs e-evkin-backend --lines 10 --nostream
        exit 1
    fi
done

# Save PM2 config
pm2 save

# Final memory check
check_memory

# Final status
log "📊 Low Memory Deployment completed!"
log "=================================="
log "📅 Date: $(date)"
log "💾 Final memory: $(free -h | awk 'NR==2{print $7 " available"}')"
log "🔧 Backend: Running with PM2 (400MB limit)"
log "🎨 Frontend: Built (Size: $BUILD_SIZE)"
log "🔗 Health: $BACKEND_URL"

echo ""
echo "✅ LOW MEMORY DEPLOYMENT SUCCESSFUL!"
echo ""
echo "💾 Memory optimizations applied:"
echo "- Node.js heap limit: 384MB for runtime"
echo "- PM2 restart limit: 400MB"
echo "- Minimal dev dependencies"
echo "- No source maps or incremental builds"
echo "- Post-build cleanup"
echo ""
echo "🔍 Quick checks:"
echo "- PM2 status: pm2 list"
echo "- Memory usage: free -h"
echo "- Backend logs: pm2 logs e-evkin-backend"
echo "- Backend health: curl $BACKEND_URL"
echo ""
echo "⚠️  Low memory server recommendations:"
echo "- Monitor PM2 restart frequency"
echo "- Consider adding swap if frequent restarts"
echo "- Keep development builds minimal"
echo "- Regular cleanup of logs and temp files"

log "🎉 Low memory deployment completed successfully!"