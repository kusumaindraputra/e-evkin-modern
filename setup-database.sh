#!/bin/bash

# E-EVKIN Modern - Database Setup Script
# Creates database and runs seeder for first-time setup

echo "🗄️ E-EVKIN Modern - Database Setup"
echo "=================================="

# Stop PM2 first
pm2 stop e-evkin-backend 2>/dev/null || true

# Database configuration
DB_NAME="e_evkin_modern"
DB_USER="postgres"
DB_PASSWORD="admin"  # Update this with your actual password

echo "🔍 Checking PostgreSQL status..."
if ! systemctl is-active --quiet postgresql; then
    echo "🚀 Starting PostgreSQL..."
    systemctl start postgresql
fi

echo "✅ PostgreSQL is running"

# Check if database exists
echo "🔍 Checking if database exists..."
DB_EXISTS=$(sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -w $DB_NAME | wc -l)

if [ $DB_EXISTS -eq 0 ]; then
    echo "❌ Database '$DB_NAME' does not exist"
    echo "🔧 Creating database..."
    
    # Create database
    sudo -u postgres createdb $DB_NAME
    
    if [ $? -eq 0 ]; then
        echo "✅ Database '$DB_NAME' created successfully"
    else
        echo "❌ Failed to create database"
        exit 1
    fi
else
    echo "✅ Database '$DB_NAME' already exists"
fi

# Check if user has access
echo "🔍 Checking database user access..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || {
    echo "⚠️  User access grant skipped (may already exist)"
}

# Test connection
echo "🧪 Testing database connection..."
cd /www/wwwroot/e-evkin-modern/backend

# Update .env if needed
if ! grep -q "NODE_ENV=production" .env; then
    echo "⚙️ Updating .env for production..."
    sed -i 's/NODE_ENV=development/NODE_ENV=production/' .env
fi

# Test connection
node -e "
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

pool.connect()
  .then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ Database connection failed:', err.message);
    console.log('🔧 Check your database password in .env file');
    process.exit(1);
  });
"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Database connection failed!"
    echo "🔧 Please check your database password in .env file"
    echo "Current .env database settings:"
    grep "DB_" .env
    echo ""
    echo "To fix:"
    echo "1. Update DB_PASSWORD in .env file"
    echo "2. Or create postgres user with correct password:"
    echo "   sudo -u postgres psql -c \"ALTER USER postgres PASSWORD 'your-password';\""
    exit 1
fi

echo ""
echo "🌱 Running database seeder..."

# Check if seeder exists
if [ -f "src/seeders/seed.ts" ]; then
    echo "📦 Running TypeScript seeder..."
    npx tsx src/seeders/seed.ts
elif [ -f "src/seeders/seed.js" ]; then
    echo "📦 Running JavaScript seeder..."
    node src/seeders/seed.js
else
    echo "❌ No seeder found. Creating basic tables..."
    # Run migrations if available, or create basic structure
    npx sequelize-cli db:migrate 2>/dev/null || echo "⚠️  No migrations available"
fi

echo ""
echo "🚀 Starting backend..."
cd /www/wwwroot/e-evkin-modern

# Start with production environment
pm2 start backend/dist/server.js --name e-evkin-backend \
  --max-memory-restart 400M \
  --env NODE_ENV=production \
  --env PORT=5000

echo "⏳ Waiting for backend to start..."
sleep 8

echo "🏥 Testing health endpoint..."
for i in {1..5}; do
    if curl -f -s http://localhost:5000/health > /dev/null; then
        echo "✅ SUCCESS! Backend is now running"
        echo ""
        echo "🎉 Database setup completed!"
        echo "📊 PM2 Status:"
        pm2 list
        echo ""
        echo "🔗 Health check:"
        curl -s http://localhost:5000/health | jq . 2>/dev/null || curl -s http://localhost:5000/health
        echo ""
        echo "💾 Saving PM2 configuration..."
        pm2 save
        echo ""
        echo "✅ Setup complete! Backend is ready for production."
        exit 0
    else
        echo "⏳ Health check attempt $i/5..."
        sleep 3
    fi
done

echo "❌ Backend still not responding after setup"
echo "📝 Check logs:"
pm2 logs e-evkin-backend --lines 10