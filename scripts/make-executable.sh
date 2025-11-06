#!/bin/bash

# E-EVKIN Modern - Make Scripts Executable via Git
# This script adds executable permission to all deployment scripts

echo "🔧 Making deployment scripts executable..."
echo "=========================================="

# Main deployment script
echo "🚀 Main deployment script..."
git add --chmod=+x deploy.sh

# Other deployment scripts
echo "📄 Other deployment scripts..."
git add --chmod=+x scripts/backup.sh
git add --chmod=+x scripts/health-check.sh
git add --chmod=+x scripts/generate-jwt-secret.sh

# Server optimization script
echo "🔧 Server optimization script..."
git add --chmod=+x scripts/optimize-server.sh

# Backend scripts
echo "📦 Backend scripts..."
git add --chmod=+x backend/deploy-backend.sh
git add --chmod=+x backend/run-backend.sh

# Frontend scripts
echo "🎨 Frontend scripts..."
git add --chmod=+x frontend/deploy-frontend.sh
git add --chmod=+x frontend/run-frontend.sh

# This script itself
echo "🔧 Helper script..."
git add --chmod=+x scripts/make-executable.sh

echo ""
echo "✅ All scripts marked as executable in git"
echo ""
echo "📋 Next steps:"
echo "   1. git commit -m 'Make all deployment scripts executable'"
echo "   2. git push"
echo ""
echo "📝 Files marked as executable:"
echo "   - deploy.sh (Main comprehensive deployment script)"
echo "   - scripts/optimize-server.sh (Server optimization for 2GB RAM)"
echo "   - scripts/backup.sh"
echo "   - scripts/health-check.sh"
echo "   - scripts/generate-jwt-secret.sh"
echo "   - backend/deploy-backend.sh"
echo "   - backend/run-backend.sh"
echo "   - frontend/deploy-frontend.sh"
echo "   - frontend/run-frontend.sh"
echo "   - scripts/make-executable.sh"
echo ""
echo "🎯 Primary deployment script: ./deploy.sh"
echo "   Usage: ./deploy.sh [--skip-deps] [--skip-build] [--production]"
echo ""
echo "🔧 Server optimization script: ./scripts/optimize-server.sh"
echo "   Usage: sudo ./scripts/optimize-server.sh (run as root)"
