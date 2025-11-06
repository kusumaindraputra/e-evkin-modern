#!/bin/bash

# E-EVKIN Modern - Backend Run Script
# This script starts the backend application

set -e

echo "🚀 Starting E-EVKIN Backend"
echo "============================"

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if build exists
if [ ! -d "dist" ]; then
    echo "❌ Build not found! Please run ./deploy-backend.sh first"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found! Please run ./deploy-backend.sh first"
    exit 1
fi

# Load environment variables
source .env

echo "📋 Configuration:"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"
echo "   DB_NAME: $DB_NAME"
echo ""

# Start the server
echo "▶️  Starting backend server..."
node dist/server.js
