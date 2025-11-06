#!/bin/bash

# E-EVKIN Modern - Frontend Deployment Script
# This script builds the frontend application

set -e

echo "🚀 E-EVKIN Frontend Deployment"
echo "==============================="
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
    
    cat > .env << 'EOF'
# API Configuration
VITE_API_URL=http://localhost:5000/api
EOF
    
    echo "✅ .env file created"
    echo "⚠️  IMPORTANT: Update VITE_API_URL in .env file!"
    echo "   Example: VITE_API_URL=https://your-backend-domain.com/api"
fi

# Display current configuration
echo "📋 Current configuration:"
cat .env
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build
echo "🔨 Building frontend..."
npm run build

# Check build output
if [ -d "dist" ]; then
    echo "✅ Frontend build completed successfully!"
    echo ""
    echo "📦 Build output in: $SCRIPT_DIR/dist"
    echo "📊 Build size:"
    du -sh dist/
    echo ""
    echo "📋 Next steps:"
    echo "   1. Verify .env configuration"
    echo "   2. Deploy dist/ folder to web server (Nginx/Apache)"
    echo "   3. Or run locally: ./run-frontend.sh"
else
    echo "❌ Build failed! dist/ folder not found"
    exit 1
fi
