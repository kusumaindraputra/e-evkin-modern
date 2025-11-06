#!/bin/bash

# E-EVKIN Modern - Docker Build Script (Backend Only)
# This script builds only the backend Docker image

set -e

echo "🐳 E-EVKIN Docker - Build Backend"
echo "=================================="
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed!"
    echo ""
    echo "📋 Install Docker first:"
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
else
    DOCKER_VERSION=$(docker --version)
    echo "✅ Docker installed: $DOCKER_VERSION"
fi

echo ""
echo "🔨 Building backend Docker image..."
echo ""

# Build backend image
docker build -t evkin-backend:latest ./backend

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Backend image built successfully!"
    echo ""
    echo "📦 Image details:"
    docker images evkin-backend:latest
    echo ""
    echo "📋 Next steps:"
    echo "   1. Build other services: ./docker/build-frontend.sh"
    echo "   2. Or build all: docker-compose build"
    echo "   3. Run services: docker-compose up -d"
else
    echo ""
    echo "❌ Build failed!"
    exit 1
fi
