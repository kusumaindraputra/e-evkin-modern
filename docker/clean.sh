#!/bin/bash

# E-EVKIN Modern - Docker Clean Script
# This script removes all containers, volumes, and images

set -e

echo "🧹 E-EVKIN Docker - Clean Up"
echo "============================"
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

echo "⚠️  This will remove:"
echo "   - All containers"
echo "   - All volumes (including database data!)"
echo "   - Network"
echo ""
read -p "Are you sure? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

echo ""
echo "🧹 Cleaning up..."

# Stop and remove containers, volumes, and network
$COMPOSE_CMD down -v

echo ""
echo "🗑️  Removing images..."
docker rmi evkin-backend:latest evkin-frontend:latest 2>/dev/null || echo "Some images were already removed"

echo ""
echo "✅ Cleanup completed!"
echo ""
echo "📝 To rebuild and restart:"
echo "   1. Build: ./docker/build-all.sh"
echo "   2. Run: ./docker/run-all.sh"
echo "   3. Seed: docker-compose exec backend npm run seed"
