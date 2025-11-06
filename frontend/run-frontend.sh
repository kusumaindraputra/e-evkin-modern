#!/bin/bash

# E-EVKIN Modern - Frontend Run Script
# This script runs the frontend in preview mode (after build)

set -e

echo "🚀 Starting E-EVKIN Frontend Preview"
echo "====================================="

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if build exists
if [ ! -d "dist" ]; then
    echo "❌ Build not found! Please run ./deploy-frontend.sh first"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found! Please run ./deploy-frontend.sh first"
    exit 1
fi

echo "📋 Configuration:"
cat .env
echo ""

# Start preview server
echo "▶️  Starting preview server..."
echo "🌐 Frontend will be available at: http://localhost:4173"
echo ""
npm run preview
