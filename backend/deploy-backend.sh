#!/bin/bash

# E-EVKIN Modern - Backend Deployment Script
# This script builds and runs the backend application

set -e

echo "🚀 E-EVKIN Backend Deployment"
echo "=============================="
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed!"
    echo ""
    echo "📋 Install Node.js first:"
    echo "   Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "   CentOS/RHEL:   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - && sudo yum install -y nodejs"
    echo "   Or visit: https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node --version)
    echo "✅ Node.js installed: $NODE_VERSION"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed!"
    echo ""
    echo "📋 npm usually comes with Node.js. Try reinstalling Node.js"
    exit 1
else
    NPM_VERSION=$(npm --version)
    echo "✅ npm installed: $NPM_VERSION"
fi

echo ""

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from template..."
    echo ""
    
    # Generate secure JWT_SECRET
    echo "🔐 Generating secure JWT_SECRET..."
    if command -v node &> /dev/null; then
        JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
        echo "✅ JWT_SECRET generated using Node.js crypto"
    elif command -v openssl &> /dev/null; then
        JWT_SECRET=$(openssl rand -hex 64)
        echo "✅ JWT_SECRET generated using OpenSSL"
    else
        JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
        echo "⚠️  Could not auto-generate JWT_SECRET (Node.js/OpenSSL not found)"
        echo "⚠️  Using default - MUST CHANGE before production!"
    fi
    
    cat > .env << EOF
# Environment Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=evkin_db
DB_USER=admin_evkin
DB_PASSWORD=password_evkin

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Update these values in .env file:"
    echo "   - DB_PASSWORD (currently: password_evkin)"
    echo "   - CORS_ORIGIN (currently: http://localhost)"
    if [ "$JWT_SECRET" = "your-super-secret-jwt-key-change-this-in-production" ]; then
        echo "   - JWT_SECRET (currently: default - MUST CHANGE!)"
    else
        echo "   ✅ JWT_SECRET already set to secure random value"
    fi
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build
echo "🔨 Building backend..."
echo "   (This may take a few minutes...)"
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

echo "✅ Backend build completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify .env configuration"
echo "   2. Run database seed (first time only): npm run seed"
echo "   3. Start backend: ./run-backend.sh"
echo "   4. Or use PM2: pm2 start ../ecosystem.config.js"
