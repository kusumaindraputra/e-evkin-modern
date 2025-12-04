# E-EVKIN Modern - Simple Deployment Package Creator
Write-Host "Creating deployment package..." -ForegroundColor Cyan

# Timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$packageName = "e-evkin-deploy-$timestamp.zip"

# Check builds
if (-not (Test-Path "backend\dist\server.js")) {
    Write-Host "ERROR: Backend build not found! Run: npm run build" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "frontend\dist\index.html")) {
    Write-Host "ERROR: Frontend build not found! Run: npm run build" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Builds verified" -ForegroundColor Green

# Create temp directory structure
$temp = "deploy-temp"
Remove-Item -Recurse -Force $temp -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path "$temp\backend" -Force | Out-Null
New-Item -ItemType Directory -Path "$temp\frontend" -Force | Out-Null

# Copy files
Write-Host "Copying backend..." -ForegroundColor Yellow
Copy-Item -Recurse "backend\dist" "$temp\backend\"
Copy-Item -Recurse "backend\migrations" "$temp\backend\"
Copy-Item "backend\package.json" "$temp\backend\"
Copy-Item "backend\package-lock.json" "$temp\backend\"

Write-Host "Copying frontend..." -ForegroundColor Yellow
Copy-Item -Recurse "frontend\dist" "$temp\frontend\"

Write-Host "Copying root files..." -ForegroundColor Yellow
Copy-Item "package.json" "$temp\"
Copy-Item "package-lock.json" "$temp\"
Copy-Item "DEPLOYMENT.md" "$temp\"
Copy-Item "DEPLOYMENT_CHECKLIST.md" "$temp\"
Copy-Item "README.md" "$temp\"

# Create env template
Write-Host "Creating .env template..." -ForegroundColor Yellow
@"
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=e_evkin_modern
DB_USER=postgres
DB_PASS=CHANGE_THIS
JWT_SECRET=GENERATE_WITH_OPENSSL_RAND_BASE64_64
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://your-domain.com
"@ | Set-Content "$temp\backend\.env.production.template"

# Create README
@"
E-EVKIN Modern - Deployment Package
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

CONTENTS:
- backend/dist/        : Compiled backend
- backend/migrations/  : Database migrations  
- frontend/dist/       : Production build
- Documentation files

DEPLOYMENT STEPS:
1. Extract this package on server
2. Copy backend/.env.production.template to backend/.env.production
3. Edit .env.production with your database credentials
4. Generate JWT_SECRET: openssl rand -base64 64
5. npm install --production (in root and backend)
6. Run migrations: cd backend && npx sequelize-cli db:migrate
7. Start with PM2: pm2 start backend/dist/server.js

See DEPLOYMENT.md for detailed instructions.
"@ | Set-Content "$temp\DEPLOY_README.txt"

# Create ZIP
Write-Host "Creating ZIP..." -ForegroundColor Yellow
if (Test-Path $packageName) { Remove-Item $packageName }
Compress-Archive -Path "$temp\*" -DestinationPath $packageName

# Cleanup
Remove-Item -Recurse -Force $temp

# Stats
$zipSize = [math]::Round((Get-Item $packageName).Length / 1MB, 2)

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ SUCCESS!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "Package: $packageName" -ForegroundColor Cyan
Write-Host "Size: $zipSize MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Upload to server and extract" -ForegroundColor Yellow
