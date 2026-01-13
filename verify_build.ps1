$ErrorActionPreference = "Stop"

Write-Host "Verifying Docker Build..." -ForegroundColor Cyan

# 1. Check Docker Daemon
Write-Host "1. Checking Docker Daemon..."
try {
    docker info | Out-Null
    Write-Host "   Docker is running." -ForegroundColor Green
} catch {
    Write-Error "   Docker is NOT running. Please start Docker Desktop."
}

# 2. Build Backend
Write-Host "`n2. Building Backend (No Cache)..."
try {
    docker build --no-cache -t e-evkin-backend:verify ./backend
    Write-Host "   Backend Build Successful." -ForegroundColor Green
} catch {
    Write-Error "   Backend Build Failed."
}

# 3. Build Frontend
Write-Host "`n3. Building Frontend (No Cache)..."
try {
    docker build --no-cache -t e-evkin-frontend:verify ./frontend
    Write-Host "   Frontend Build Successful." -ForegroundColor Green
} catch {
    Write-Error "   Frontend Build Failed."
}

Write-Host "`nVerification Complete!" -ForegroundColor Cyan
