#!/bin/bash

# E-EVKIN Modern - Docker Build Script (All Services)
# This script builds all Docker images

set -e

echo "🐳 E-EVKIN Docker - Build All Services"
echo "======================================="
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
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Error: docker-compose is not installed!"
    echo ""
    echo "📋 Install docker-compose first:"
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

DOCKER_VERSION=$(docker --version)
echo "✅ Docker installed: $DOCKER_VERSION"

if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_VERSION=$(docker compose version)
    COMPOSE_CMD="docker compose"
fi
echo "✅ Docker Compose installed: $COMPOSE_VERSION"

echo ""
echo "🔨 Building all Docker images..."
echo ""

# Build all services
$COMPOSE_CMD build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All images built successfully!"
    echo ""
    echo "📦 Built images:"
    docker images | grep evkin
    echo ""
    echo "📋 Next steps:"
    echo "   1. Start services: $COMPOSE_CMD up -d"
    echo "   2. Check status: $COMPOSE_CMD ps"
    echo "   3. View logs: $COMPOSE_CMD logs -f"
    echo "   4. Run seed (first time): $COMPOSE_CMD exec backend npm run seed"
else
    echo ""
    echo "❌ Build failed!"
    exit 1
fi
