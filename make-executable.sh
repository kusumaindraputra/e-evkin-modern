#!/bin/bash

# E-EVKIN Modern - Make Scripts Executable via Git
# This script adds executable permission to deployment scripts

echo "🔧 Making deployment scripts executable..."
echo "=========================================="

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
git add --chmod=+x make-executable.sh

echo ""
echo "✅ All scripts marked as executable in git"
echo ""
echo "📋 Next steps:"
echo "   1. git commit -m 'Make deployment scripts executable'"
echo "   2. git push"
echo ""
echo "📝 Files marked as executable:"
echo "   - backend/deploy-backend.sh"
echo "   - backend/run-backend.sh"
echo "   - frontend/deploy-frontend.sh"
echo "   - frontend/run-frontend.sh"
echo "   - make-executable.sh"
