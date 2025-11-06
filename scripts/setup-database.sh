#!/bin/bash

# E-EVKIN Modern - Database Setup Script
# Creates the database with proper name and user

echo "🗄️ E-EVKIN Modern - Database Setup"
echo "================================="

# Database configuration
DB_NAME="e_evkin_modern"
DB_USER="postgres"
DB_PASSWORD="admin"

echo "📋 Database Configuration:"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Check PostgreSQL status
echo "🔍 Checking PostgreSQL status..."
if ! command -v psql > /dev/null 2>&1; then
    echo "❌ PostgreSQL not found. Please install PostgreSQL first."
    exit 1
fi

echo "✅ PostgreSQL found"

# Create database if not exists
echo "🔨 Creating database '$DB_NAME'..."

# Set password environment variable to avoid prompt
export PGPASSWORD="$DB_PASSWORD"

# Check if database exists
if psql -U "$DB_USER" -h localhost -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "✅ Database '$DB_NAME' already exists"
else
    # Create database
    if createdb -U "$DB_USER" -h localhost "$DB_NAME"; then
        echo "✅ Database '$DB_NAME' created successfully"
    else
        echo "❌ Failed to create database '$DB_NAME'"
        echo "💡 Try running this manually:"
        echo "   createdb -U postgres e_evkin_modern"
        echo "   OR"
        echo "   psql -U postgres"
        echo "   CREATE DATABASE e_evkin_modern;"
        exit 1
    fi
fi

# Test connection
echo "🔗 Testing database connection..."
if psql -U "$DB_USER" -h localhost -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "💡 Please check:"
    echo "   1. PostgreSQL is running"
    echo "   2. Username/password in .env file"
    echo "   3. Database permissions"
    exit 1
fi

echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "📋 Summary:"
echo "   ✅ Database: $DB_NAME"
echo "   ✅ Connection: Working"
echo "   ✅ Ready for seeding"
echo ""
echo "🚀 Next steps:"
echo "   cd backend"
echo "   npm run seed"

# Unset password
unset PGPASSWORD