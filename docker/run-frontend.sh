#!/bin/bash

# E-EVKIN Modern - Docker Run Script (Frontend Only)
# This script runs only the frontend service

set -e

echo "🐳 E-EVKIN Docker - Run Frontend"
echo "================================="
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Determine docker-compose command
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Copying from .env.docker..."
    cp .env.docker .env
    echo "✅ .env created"
    echo ""
    echo "⚠️  IMPORTANT: Update VITE_API_URL in .env"
    echo "   Example: VITE_API_URL=http://localhost:5000/api"
    echo ""
    read -p "Press Enter to continue after updating .env..."
fi

echo "🚀 Starting frontend service..."
echo ""

# Start only frontend
$COMPOSE_CMD up -d frontend

echo ""
echo "⏳ Waiting for service to be healthy..."
sleep 3

# Check status
$COMPOSE_CMD ps

echo ""
echo "✅ Frontend service started!"
echo ""
echo "📋 Service URLs:"
echo "   Frontend: http://localhost"
echo ""
echo "📝 Useful commands:"
echo "   View logs: $COMPOSE_CMD logs -f frontend"
echo "   Stop service: $COMPOSE_CMD stop frontend"
echo "   Remove container: $COMPOSE_CMD down frontend"
echo ""
echo "⚠️  Note: Backend must be running for frontend to work!"
echo "   Start backend with: ./docker/run-backend.sh"
