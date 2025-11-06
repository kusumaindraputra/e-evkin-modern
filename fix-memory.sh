#!/bin/bash

# E-EVKIN Modern - Memory Issue Quick Fix
# Run this when encountering out of memory errors during deployment

echo "🔧 E-EVKIN Modern - Memory Issue Quick Fix"
echo "==========================================="

APP_DIR="/www/wwwroot/e-evkin-modern"

# Check current memory status
echo "💾 Current memory status:"
free -h
echo ""

# Function to free memory aggressively
free_memory_aggressive() {
    echo "🧹 Aggressive memory cleanup..."
    
    # Stop all Node.js processes
    echo "🛑 Stopping Node.js processes..."
    pm2 kill 2>/dev/null || true
    pkill -f node 2>/dev/null || true
    
    # Clear npm cache
    echo "🗑️ Clearing npm cache..."
    npm cache clean --force 2>/dev/null || true
    
    # Clear system caches
    echo "🗑️ Clearing system caches..."
    sync
    echo 1 > /proc/sys/vm/drop_caches 2>/dev/null || echo "⚠️  Cannot clear system cache (need root)"
    
    # Remove node_modules to free space
    if [ -d "$APP_DIR" ]; then
        echo "🗑️ Removing node_modules to free space..."
        find $APP_DIR -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
        find $APP_DIR -name "package-lock.json" -delete 2>/dev/null || true
        find $APP_DIR -name "*.log" -delete 2>/dev/null || true
    fi
    
    # Clear /tmp directory
    echo "🗑️ Clearing temp files..."
    find /tmp -name "npm-*" -type d -exec rm -rf {} + 2>/dev/null || true
    find /tmp -name "node-*" -type f -delete 2>/dev/null || true
    
    sleep 2
    echo "✅ Memory cleanup completed"
}

# Check if we have memory issues
available_mb=$(free -m | awk 'NR==2{printf "%.0f", $7}')
echo "📊 Available memory: ${available_mb}MB"

if [ "$available_mb" -lt 300 ]; then
    echo "❌ CRITICAL: Very low memory (${available_mb}MB)"
    echo "🚨 Running aggressive cleanup..."
    free_memory_aggressive
else
    echo "⚠️  Memory is low but manageable (${available_mb}MB)"
    read -p "Run memory cleanup anyway? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        free_memory_aggressive
    fi
fi

echo ""
echo "💾 Memory status after cleanup:"
free -h

echo ""
echo "🔧 Manual Build Instructions for Low Memory Server:"
echo "=================================================="
echo ""
echo "If automatic deployment fails, try manual build:"
echo ""
echo "1. Backend Manual Build:"
echo "   cd $APP_DIR/backend"
echo "   export NODE_OPTIONS=\"--max-old-space-size=512\""
echo "   npm install --only=production"
echo "   npm install typescript @types/node --save-dev"
echo "   npx tsc --sourceMap false --incremental false"
echo ""
echo "2. Frontend Manual Build:"
echo "   cd $APP_DIR/frontend"
echo "   export NODE_OPTIONS=\"--max-old-space-size=768\""
echo "   npm install --only=production"
echo "   npm install vite @vitejs/plugin-react typescript --save-dev"
echo "   npm run build"
echo ""
echo "3. Start Backend:"
echo "   cd $APP_DIR"
echo "   export NODE_OPTIONS=\"--max-old-space-size=384\""
echo "   pm2 start backend/dist/server.js --name e-evkin-backend --max-memory-restart 400M"
echo "   pm2 save"
echo ""
echo "4. Alternative: Use Pre-built Version"
echo "   - Build on development machine"
echo "   - Upload dist/ folders via aaPanel File Manager"
echo "   - Skip npm install/build on server"
echo ""

# Offer to create swap file
echo "💡 Memory Enhancement Options:"
echo "=============================="
echo ""
echo "Option 1: Add Swap File (if none exists)"
echo "   sudo fallocate -l 1G /swapfile"
echo "   sudo chmod 600 /swapfile"
echo "   sudo mkswap /swapfile"
echo "   sudo swapon /swapfile"
echo "   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab"
echo ""
echo "Option 2: Use Low Memory Deploy Script"
echo "   ./deploy-low-memory.sh --production"
echo ""
echo "Option 3: Deploy Pre-built Files"
echo "   Build locally and upload dist/ folders"
echo ""

# Check if swap exists
if swapon --show | grep -q swap; then
    echo "✅ Swap is active:"
    swapon --show
else
    echo "⚠️  No swap detected. Consider adding swap for memory-intensive operations."
    echo ""
    read -p "Create 1GB swap file now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔧 Creating swap file..."
        if sudo fallocate -l 1G /swapfile 2>/dev/null; then
            sudo chmod 600 /swapfile
            sudo mkswap /swapfile
            sudo swapon /swapfile
            echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
            echo "✅ Swap file created and activated"
            echo "💾 New memory status:"
            free -h
        else
            echo "❌ Failed to create swap file (need root access)"
        fi
    fi
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Try: ./deploy-low-memory.sh --production"
echo "2. Or build manually using commands above"
echo "3. Monitor memory: watch 'free -h'"
echo "4. If still failing, consider building locally and uploading"

echo ""
echo "✅ Memory fix script completed!"