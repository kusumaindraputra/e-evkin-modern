#!/bin/bash

# E-EVKIN Modern - Docker Stop Script
# This script stops all running containers

set -e

echo "🛑 E-EVKIN Docker - Stop Services"
echo "=================================="
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

echo "🛑 Stopping all services..."
$COMPOSE_CMD stop

echo ""
echo "✅ All services stopped!"
echo ""
echo "📋 Container status:"
$COMPOSE_CMD ps

echo ""
echo "📝 Next steps:"
echo "   Start services: $COMPOSE_CMD up -d"
echo "   Remove containers: $COMPOSE_CMD down"
echo "   Remove with volumes: $COMPOSE_CMD down -v"
