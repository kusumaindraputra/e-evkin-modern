#!/bin/bash

# E-EVKIN Modern - Docker Build Script (Frontend Only)
# This script builds only the frontend Docker image

set -e

echo "🐳 E-EVKIN Docker - Build Frontend"
echo "==================================="
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
echo "🔨 Building frontend Docker image..."
echo ""

# Check if .env exists for build args
if [ -f ".env" ]; then
    source .env
    echo "📝 Using VITE_API_URL from .env: ${VITE_API_URL}"
else
    echo "⚠️  No .env file found, using default VITE_API_URL"
    VITE_API_URL="http://localhost:5000/api"
fi

# Build frontend image
docker build \
    --build-arg VITE_API_URL="${VITE_API_URL}" \
    -t evkin-frontend:latest \
    ./frontend

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Frontend image built successfully!"
    echo ""
    echo "📦 Image details:"
    docker images evkin-frontend:latest
    echo ""
    echo "📋 Next steps:"
    echo "   1. Build other services: ./docker/build-backend.sh"
    echo "   2. Or build all: docker-compose build"
    echo "   3. Run services: docker-compose up -d"
else
    echo ""
    echo "❌ Build failed!"
    exit 1
fi
