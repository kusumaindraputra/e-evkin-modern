#!/bin/bash

# E-EVKIN Modern - Docker Run Script (All Services)
# This script runs all services (database, backend, frontend)

set -e

echo "🐳 E-EVKIN Docker - Run All Services"
echo "====================================="
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
    echo "   - VITE_API_URL"
    echo ""
    read -p "Press Enter to continue after updating .env..."
fi

echo "🚀 Starting all services..."
echo "   - PostgreSQL database"
echo "   - Backend API"
echo "   - Frontend"
echo ""

# Start all services
$COMPOSE_CMD up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check status
$COMPOSE_CMD ps

echo ""
echo "✅ All services started!"
echo ""
echo "📋 Service URLs:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:5000"
echo "   Health Check: http://localhost:5000/api/health"
echo "   Database: localhost:5432"
echo ""
echo "📝 Useful commands:"
echo "   View logs (all): $COMPOSE_CMD logs -f"
echo "   View logs (backend): $COMPOSE_CMD logs -f backend"
echo "   View logs (frontend): $COMPOSE_CMD logs -f frontend"
echo "   Stop services: $COMPOSE_CMD stop"
echo "   Remove containers: $COMPOSE_CMD down"
echo "   Remove with volumes: $COMPOSE_CMD down -v"
echo ""
echo "🌱 First time setup:"
echo "   Run database seed: $COMPOSE_CMD exec backend npm run seed"
echo ""
echo "🔐 Default credentials:"
echo "   Admin: dinkes / dinkes123"
echo "   Puskesmas: cibinong / bogorkab"
