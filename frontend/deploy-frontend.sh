#!/bin/bash

# E-EVKIN Modern - Frontend Deployment Script
# This script builds the frontend application

set -e

echo "🚀 E-EVKIN Frontend Deployment"
echo "==============================="

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
    exit 1
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
