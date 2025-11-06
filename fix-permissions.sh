#!/bin/bash

# E-EVKIN Modern - Permission Fix Script for aaPanel
# Run this if you encounter permission issues during deployment

echo "🔧 E-EVKIN Modern - Permission Fix for aaPanel"
echo "=============================================="

APP_DIR="/www/wwwroot/e-evkin-modern"

# Check if directory exists
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Application directory $APP_DIR does not exist"
    exit 1
fi

echo "📂 Fixing permissions for: $APP_DIR"

# Fix ownership (assuming www user for aaPanel)
if id "www" &>/dev/null; then
    echo "👤 Setting ownership to www user..."
    chown -R www:www $APP_DIR
    echo "✅ Ownership fixed"
else
    echo "⚠️  www user not found, keeping current ownership"
fi

# Fix directory permissions
echo "📁 Setting directory permissions..."
find $APP_DIR -type d -exec chmod 755 {} \;
echo "✅ Directory permissions set to 755"

# Fix file permissions
echo "📄 Setting file permissions..."
find $APP_DIR -type f -exec chmod 644 {} \;
echo "✅ File permissions set to 644"

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x $APP_DIR/*.sh 2>/dev/null || echo "⚠️  No .sh files found in root"
chmod +x $APP_DIR/scripts/*.sh 2>/dev/null || echo "⚠️  No scripts directory found"

# Fix node_modules permissions if they exist
if [ -d "$APP_DIR/backend/node_modules" ]; then
    echo "📦 Fixing backend node_modules permissions..."
    chmod -R 755 $APP_DIR/backend/node_modules
fi

if [ -d "$APP_DIR/frontend/node_modules" ]; then
    echo "📦 Fixing frontend node_modules permissions..."
    chmod -R 755 $APP_DIR/frontend/node_modules
fi

# Create logs directory with proper permissions
echo "📝 Setting up logs directory..."
mkdir -p $APP_DIR/backend/logs
chmod 755 $APP_DIR/backend/logs

# Fix PM2 related permissions
if command -v pm2 >/dev/null 2>&1; then
    echo "🔄 Fixing PM2 permissions..."
    pm2 kill 2>/dev/null || echo "⚠️  No PM2 processes to kill"
    
    # Clear PM2 cache
    rm -rf ~/.pm2/logs/* 2>/dev/null || echo "⚠️  No PM2 logs to clear"
    rm -rf ~/.pm2/pids/* 2>/dev/null || echo "⚠️  No PM2 pids to clear"
fi

echo ""
echo "✅ Permission fixes completed!"
echo ""
echo "📋 Summary of changes:"
echo "- Ownership: Set to www:www (if www user exists)"
echo "- Directories: 755 permissions"
echo "- Files: 644 permissions" 
echo "- Scripts: Made executable"
echo "- Logs: Directory created with proper permissions"
echo "- PM2: Cache cleared"
echo ""
echo "🚀 Try running the deployment script again:"
echo "   ./deploy-aapanel.sh"
echo "   or"
echo "   ./deploy.sh --production"
echo ""

# Show current permissions for verification
echo "🔍 Current permissions verification:"
ls -la $APP_DIR/ | head -10