#!/bin/bash

# E-EVKIN Modern - Backend Deployment Script
# This script builds and runs the backend application

set -e

echo "🚀 E-EVKIN Backend Deployment"
echo "=============================="

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from template..."
    
    cat > .env << 'EOF'
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
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    
    echo "✅ .env file created"
    echo "⚠️  IMPORTANT: Update DB_PASSWORD and JWT_SECRET in .env file!"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build
echo "🔨 Building backend..."
npm run build

echo "✅ Backend build completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify .env configuration"
echo "   2. Run database seed (first time only): npm run seed"
echo "   3. Start backend: ./run-backend.sh"
echo "   4. Or use PM2: pm2 start ../ecosystem.config.js"
