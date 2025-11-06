#!/bin/bash

# E-EVKIN Modern - Docker Run Script (Backend Only)
# This script runs only the backend service with database

set -e

echo "🐳 E-EVKIN Docker - Run Backend"
echo "================================"
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
    echo "⚠️  IMPORTANT: Update these values in .env:"
    echo "   - DB_PASSWORD"
    echo "   - JWT_SECRET (generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\")"
    echo "   - CORS_ORIGIN"
    echo ""
    read -p "Press Enter to continue after updating .env..."
fi

echo "🚀 Starting backend services..."
echo "   - PostgreSQL database"
echo "   - Backend API"
echo ""

# Start only backend and database
$COMPOSE_CMD up -d postgres backend

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check status
$COMPOSE_CMD ps

echo ""
echo "✅ Backend services started!"
echo ""
echo "📋 Service URLs:"
echo "   Backend API: http://localhost:5000"
echo "   Health Check: http://localhost:5000/api/health"
echo "   Database: localhost:5432"
echo ""
echo "📝 Useful commands:"
echo "   View logs: $COMPOSE_CMD logs -f backend"
echo "   Stop services: $COMPOSE_CMD stop backend postgres"
echo "   Remove containers: $COMPOSE_CMD down"
echo "   Run seed (first time): $COMPOSE_CMD exec backend npm run seed"
