#!/bin/bash

# E-EVKIN Modern - Module Dependencies Fix
# Fixes MODULE_NOT_FOUND errors after deployment

echo "🔧 E-EVKIN Modern - Dependencies Diagnosis & Fix"
echo "================================================"

APP_DIR="/www/wwwroot/e-evkin-modern"
BACKEND_DIR="$APP_DIR/backend"

cd $BACKEND_DIR

echo "🔍 Diagnosing MODULE_NOT_FOUND error..."

# Check current directory
echo "📂 Current directory: $(pwd)"

# Check if dist exists and has files
echo "📁 Checking dist directory:"
if [ -d "dist" ]; then
    ls -la dist/
    echo ""
    echo "📄 Server.js exists: $(test -f dist/server.js && echo "✅ YES" || echo "❌ NO")"
else
    echo "❌ dist directory not found!"
fi

# Check package.json
echo ""
echo "📦 Checking package.json dependencies:"
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
    echo "📋 Production dependencies:"
    node -pe "Object.keys(JSON.parse(require('fs').readFileSync('package.json')).dependencies || {}).join(', ')"
else
    echo "❌ package.json not found!"
fi

# Check node_modules
echo ""
echo "📁 Checking node_modules:"
if [ -d "node_modules" ]; then
    echo "✅ node_modules exists"
    echo "📊 Modules count: $(ls node_modules/ | wc -l)"
    
    # Check for common missing modules
    missing_modules=()
    critical_modules=("express" "cors" "helmet" "dotenv" "sequelize" "pg" "jsonwebtoken" "bcryptjs" "compression" "cookie-parser")
    
    for module in "${critical_modules[@]}"; do
        if [ ! -d "node_modules/$module" ]; then
            missing_modules+=("$module")
        fi
    done
    
    if [ ${#missing_modules[@]} -gt 0 ]; then
        echo "❌ Missing critical modules: ${missing_modules[*]}"
    else
        echo "✅ All critical modules present"
    fi
else
    echo "❌ node_modules not found!"
fi

# Check .env file
echo ""
echo "⚙️ Checking environment configuration:"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "🔑 NODE_ENV: $(grep NODE_ENV .env | cut -d'=' -f2)"
    echo "🔌 PORT: $(grep PORT .env | cut -d'=' -f2)"
    echo "🗄️ DB_NAME: $(grep DB_NAME .env | cut -d'=' -f2)"
else
    echo "❌ .env file not found!"
fi

echo ""
echo "🚨 FIXING DEPENDENCIES..."
echo "========================"

# Stop PM2 first
echo "🛑 Stopping PM2 processes..."
pm2 stop e-evkin-backend 2>/dev/null || true
pm2 delete e-evkin-backend 2>/dev/null || true

# Fix 1: Reinstall all dependencies properly
echo "🔧 Fix 1: Reinstalling all dependencies..."
rm -rf node_modules package-lock.json

# Set memory limit
export NODE_OPTIONS="--max-old-space-size=512"

# Install production dependencies
echo "📦 Installing production dependencies..."
npm install --only=production --no-audit --no-fund

# Check if install was successful
if [ ! -d "node_modules" ]; then
    echo "❌ npm install failed!"
    exit 1
fi

# Fix 2: Install dev dependencies needed for runtime
echo "📦 Installing additional runtime dependencies..."
npm install typescript ts-node @types/node --save-dev

# Fix 3: Verify all critical modules are present
echo "🔍 Verifying critical modules..."
missing_modules=()
critical_modules=("express" "cors" "helmet" "dotenv" "sequelize" "pg" "jsonwebtoken" "bcryptjs" "compression" "cookie-parser" "express-rate-limit")

for module in "${critical_modules[@]}"; do
    if [ ! -d "node_modules/$module" ]; then
        echo "❌ Missing: $module"
        missing_modules+=("$module")
    else
        echo "✅ Found: $module"
    fi
done

# Install any missing critical modules
if [ ${#missing_modules[@]} -gt 0 ]; then
    echo "🔧 Installing missing modules: ${missing_modules[*]}"
    npm install "${missing_modules[@]}"
fi

# Fix 4: Rebuild TypeScript with proper paths
echo "🔨 Rebuilding backend..."
rm -rf dist/

# Create enhanced tsconfig for production
cat > tsconfig.prod.json << 'EOF'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "sourceMap": false,
    "declaration": false,
    "removeComments": true,
    "incremental": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
EOF

# Build with enhanced config
export NODE_OPTIONS="--max-old-space-size=768"
npx tsc -p tsconfig.prod.json

if [ ! -f "dist/server.js" ]; then
    echo "❌ TypeScript build failed!"
    echo "🔧 Trying alternative build..."
    npx tsc --outDir dist --rootDir src --skipLibCheck --esModuleInterop
    
    if [ ! -f "dist/server.js" ]; then
        echo "❌ Build failed completely!"
        exit 1
    fi
fi

echo "✅ Backend build successful"

# Fix 5: Test the built application
echo "🧪 Testing built application..."
cd dist

# Check if server.js can be loaded
node -e "
try {
  console.log('🔍 Testing server.js import...');
  require('./server.js');
  console.log('✅ Server.js loads successfully');
} catch (error) {
  console.log('❌ Server.js failed to load:');
  console.log(error.message);
  console.log('');
  console.log('🔧 Checking for missing modules in built code...');
  
  // Check the actual error
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('Missing module:', error.message);
  }
  
  process.exit(1);
}" || {
    echo "❌ Application test failed"
    echo "📝 Check the error above and install missing dependencies"
    cd ..
    exit 1
}

cd ..

# Fix 6: Create .env if missing
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file from template..."
    cp .env.example .env 2>/dev/null || {
        cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=e_evkin_modern
DB_USER=postgres
DB_PASSWORD=admin
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    }
    echo "⚠️  Please update .env with your production settings!"
fi

# Fix 7: Start with proper PM2 configuration
echo "🚀 Starting backend with PM2..."

# Create production PM2 config
cat > ecosystem.fixed.config.js << 'EOF'
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
    max_memory_restart: '500M',
    min_uptime: '10s',
    max_restarts: 3,
    restart_delay: 3000,
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    watch: false
  }]
}
EOF

# Ensure logs directory exists
mkdir -p logs

# Start with fixed config
cd $APP_DIR
pm2 start ecosystem.fixed.config.js

echo "⏳ Waiting for backend to start..."
sleep 8

# Final health check
echo "🏥 Final health check..."
for i in {1..5}; do
    if curl -f -s http://localhost:5000/health > /dev/null 2>&1; then
        echo "✅ Backend health check passed!"
        echo "🎉 Dependencies fix completed successfully!"
        
        echo ""
        echo "📊 Final status:"
        pm2 list
        
        echo ""
        echo "🔍 Quick verification:"
        echo "curl http://localhost:5000/health"
        curl -s http://localhost:5000/health | jq . 2>/dev/null || curl -s http://localhost:5000/health
        
        exit 0
    else
        echo "⏳ Health check attempt $i/5..."
        if [ $i -eq 5 ]; then
            echo "❌ Health check still failing"
            echo "📝 PM2 logs:"
            pm2 logs e-evkin-backend --lines 10
            echo ""
            echo "🔧 Manual debugging steps:"
            echo "1. pm2 logs e-evkin-backend"
            echo "2. cd $BACKEND_DIR && node dist/server.js"
            echo "3. Check .env configuration"
            exit 1
        fi
        sleep 2
    fi
done