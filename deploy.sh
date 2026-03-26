#!/bin/bash
set -euo pipefail

# E-EVKIN Modern - Production Deployment Script
# Usage: ./deploy.sh [--production|--skip-deps]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Parse flags
PRODUCTION=false
SKIP_DEPS=false
for arg in "$@"; do
  case $arg in
    --production) PRODUCTION=true ;;
    --skip-deps)  SKIP_DEPS=true ;;
    *)            warn "Unknown argument: $arg" ;;
  esac
done

ENV_LABEL="staging"
if [ "$PRODUCTION" = true ]; then
  ENV_LABEL="production"
fi

log "Starting ${ENV_LABEL} deployment..."

# ── 1. Pre-flight checks ──────────────────────────────────────────
log "Running pre-flight checks..."

command -v node >/dev/null 2>&1 || err "Node.js is not installed"
command -v npm  >/dev/null 2>&1 || err "npm is not installed"
command -v pm2  >/dev/null 2>&1 || err "PM2 is not installed (npm install -g pm2)"

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  err "Node.js >= 20 required (current: $(node -v))"
fi

# ── 2. Git pull latest ────────────────────────────────────────────
log "Pulling latest changes..."
git pull --ff-only || err "Git pull failed. Resolve conflicts first."

# ── 3. Install dependencies ───────────────────────────────────────
if [ "$SKIP_DEPS" = false ]; then
  log "Installing dependencies..."
  npm install --production=false 2>&1 | tail -5
else
  warn "Skipping dependency install (--skip-deps)"
fi

# ── 4. Backend build ─────────────────────────────────────────────
log "Building backend..."
cd backend
npx tsc || err "Backend TypeScript compilation failed"
cd ..

# ── 5. Frontend build ────────────────────────────────────────────
log "Building frontend..."
cd frontend
if [ "$PRODUCTION" = true ]; then
  VITE_API_URL=/api npx vite build || err "Frontend build failed"
else
  npx vite build || err "Frontend build failed"
fi
cd ..

# ── 6. Copy environment config ───────────────────────────────────
if [ "$PRODUCTION" = true ]; then
  if [ -f backend/.env.production ]; then
    log "Applying production environment..."
    cp backend/.env.production backend/.env
  else
    warn "No .env.production found, using existing .env"
  fi
else
  if [ -f backend/.env.staging ]; then
    log "Applying staging environment..."
    cp backend/.env.staging backend/.env
  fi
fi

# ── 7. Validate critical env vars ────────────────────────────────
if [ "$PRODUCTION" = true ]; then
  log "Validating production environment..."
  source backend/.env 2>/dev/null || true
  if [[ "${DB_PASSWORD:-}" == "CHANGE_THIS_IN_PRODUCTION" ]]; then
    err "DB_PASSWORD is still the placeholder! Update backend/.env before deploying."
  fi
  if [[ "${JWT_SECRET:-}" == "CHANGE_THIS_TO_SECURE_RANDOM_STRING" ]]; then
    err "JWT_SECRET is still the placeholder! Update backend/.env before deploying."
  fi
fi

# ── 8. Create logs directory ─────────────────────────────────────
mkdir -p backend/logs

# ── 9. Restart PM2 ───────────────────────────────────────────────
log "Restarting PM2 process..."
if pm2 describe e-evkin-backend > /dev/null 2>&1; then
  pm2 reload config/ecosystem.config.js --env "$ENV_LABEL"
else
  pm2 start config/ecosystem.config.js --env "$ENV_LABEL"
fi
pm2 save

# ── 10. Health check ─────────────────────────────────────────────
log "Running health check..."
sleep 3
HEALTH_URL="http://localhost:5000/health"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  log "Health check passed (HTTP $HTTP_CODE)"
else
  warn "Health check returned HTTP $HTTP_CODE - check pm2 logs: pm2 logs e-evkin-backend"
fi

# ── 11. Summary ──────────────────────────────────────────────────
echo ""
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo -e "${GREEN} Deployment complete (${ENV_LABEL})${NC}"
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo -e " Backend:  http://localhost:5000"
echo -e " PM2:      pm2 status / pm2 logs e-evkin-backend"
echo -e " Nginx:    sudo nginx -t && sudo systemctl reload nginx"
echo ""
if [ "$PRODUCTION" = true ]; then
  echo -e "${YELLOW} Reminder: Verify nginx config and reload if updated${NC}"
  echo -e "${YELLOW}   sudo cp config/nginx.conf /etc/nginx/sites-available/e-evkin${NC}"
  echo -e "${YELLOW}   sudo nginx -t && sudo systemctl reload nginx${NC}"
fi
