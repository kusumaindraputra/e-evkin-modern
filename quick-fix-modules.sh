#!/bin/bash

# E-EVKIN Modern - Quick MODULE_NOT_FOUND Fix
# Run this immediately when you get MODULE_NOT_FOUND errors

echo "🚨 Quick Fix for MODULE_NOT_FOUND Error"
echo "======================================="

APP_DIR="/www/wwwroot/e-evkin-modern"
BACKEND_DIR="$APP_DIR/backend"

cd $BACKEND_DIR

echo "🛑 Stopping PM2..."
pm2 stop e-evkin-backend 2>/dev/null || true
pm2 delete e-evkin-backend 2>/dev/null || true

echo "🔧 Quick Dependencies Fix..."

# Method 1: Reinstall production dependencies only
export NODE_OPTIONS="--max-old-space-size=512"
rm -rf node_modules package-lock.json

echo "📦 Installing dependencies..."
npm install --only=production

# Install missing critical modules that are often missing
echo "📦 Installing critical modules..."
npm install express cors helmet dotenv sequelize pg jsonwebtoken bcryptjs compression cookie-parser express-rate-limit

echo "🚀 Restarting backend..."
cd $APP_DIR

# Use simple PM2 start without config file
pm2 start backend/dist/server.js --name e-evkin-backend --max-memory-restart 500M

echo "⏳ Testing health..."
sleep 5

if curl -f -s http://localhost:5000/health > /dev/null; then
    echo "✅ Quick fix successful!"
    pm2 list
    echo ""
    echo "Test: curl http://localhost:5000/health"
    curl -s http://localhost:5000/health
else
    echo "❌ Quick fix failed. Running full diagnosis..."
    ./fix-dependencies.sh
fi