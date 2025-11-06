# E-EVKIN Modern - Database Setup Script (PowerShell)
# Creates the database with proper name and user

Write-Host "🗄️ E-EVKIN Modern - Database Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Database configuration
$DB_NAME = "e_evkin_modern"
$DB_USER = "postgres"
$DB_PASSWORD = "admin"

Write-Host "📋 Database Configuration:" -ForegroundColor Cyan
Write-Host "   Database: $DB_NAME" -ForegroundColor White
Write-Host "   User: $DB_USER" -ForegroundColor White
Write-Host ""

# Check PostgreSQL
Write-Host "🔍 Checking PostgreSQL..." -ForegroundColor Cyan
try {
    $null = Get-Command psql -ErrorAction Stop
    Write-Host "✅ PostgreSQL found" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL not found. Please install PostgreSQL first." -ForegroundColor Red
    Write-Host "💡 Download from: https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

# Set environment for password
$env:PGPASSWORD = $DB_PASSWORD

# Create database
Write-Host "🔨 Creating database '$DB_NAME'..." -ForegroundColor Cyan

try {
    # Check if database exists
    $checkDb = psql -U $DB_USER -h localhost -lqt | findstr $DB_NAME
    
    if ($checkDb) {
        Write-Host "✅ Database '$DB_NAME' already exists" -ForegroundColor Green
    } else {
        # Create database
        $result = createdb -U $DB_USER -h localhost $DB_NAME 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database '$DB_NAME' created successfully" -ForegroundColor Green
        } else {
            throw "Failed to create database"
        }
    }
    
    # Test connection
    Write-Host "🔗 Testing database connection..." -ForegroundColor Cyan
    $testResult = psql -U $DB_USER -h localhost -d $DB_NAME -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful" -ForegroundColor Green
    } else {
        throw "Database connection failed"
    }
    
} catch {
    Write-Host "❌ Database setup failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Try this manually:" -ForegroundColor Yellow
    Write-Host "   1. Open pgAdmin or psql" -ForegroundColor White
    Write-Host "   2. Run: CREATE DATABASE e_evkin_modern;" -ForegroundColor White
    Write-Host "   3. Or check your PostgreSQL service is running" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   - Check PostgreSQL service: Get-Service postgresql*" -ForegroundColor White
    Write-Host "   - Start service: Start-Service postgresql-x64-14" -ForegroundColor White
    Write-Host "   - Check .env file for correct credentials" -ForegroundColor White
    
    # Clean up
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    exit 1
}

# Clean up
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "🎉 Database setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Database: $DB_NAME" -ForegroundColor White
Write-Host "   ✅ Connection: Working" -ForegroundColor White
Write-Host "   ✅ Ready for seeding" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm run seed" -ForegroundColor White