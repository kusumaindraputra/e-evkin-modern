@echo off
echo 🗄️ E-EVKIN Modern - Create Database
echo ==============================

echo.
echo 📋 Creating database: e_evkin_modern
echo    Username: postgres
echo    Password: admin
echo.

echo 💡 Running SQL script...
psql -U postgres -f create-database.sql

if %ERRORLEVEL% EQU 0 (
    echo ✅ Database created successfully!
    echo.
    echo 🚀 Next steps:
    echo    cd ..\backend
    echo    npm run seed
) else (
    echo ❌ Failed to create database
    echo.
    echo 💡 Try manually:
    echo    1. Open pgAdmin or psql
    echo    2. Run: CREATE DATABASE e_evkin_modern;
)

pause