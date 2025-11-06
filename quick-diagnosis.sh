#!/bin/bash

# Quick diagnosis for current error
echo "🔍 Quick Diagnosis"
echo "=================="

cd /www/wwwroot/e-evkin-modern/backend

echo "📊 PM2 Status:"
pm2 list

echo ""
echo "🔍 Testing manual server start:"
timeout 10s node dist/server.js &
MANUAL_PID=$!
sleep 3

# Test health
echo "🏥 Testing health endpoint:"
curl -v http://localhost:5000/health 2>&1 | head -20

# Kill manual test
kill $MANUAL_PID 2>/dev/null

echo ""
echo "📋 Environment check:"
echo "NODE_ENV: $(grep NODE_ENV .env 2>/dev/null | cut -d'=' -f2 || echo 'NOT SET')"
echo "PORT: $(grep PORT .env 2>/dev/null | cut -d'=' -f2 || echo 'NOT SET')"

echo ""
echo "🔍 Checking .env file:"
if [ -f ".env" ]; then
    echo "✅ .env exists"
    head -5 .env
else
    echo "❌ .env missing!"
    echo "Creating basic .env..."
    cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=e_evkin_modern
DB_USER=postgres
DB_PASSWORD=admin
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    echo "✅ Basic .env created"
fi

echo ""
echo "🔍 Testing database connection:"
node -e "
require('dotenv').config();
console.log('Testing with these settings:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);

try {
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
      process.exit(1);
    });
} catch (error) {
  console.log('❌ Database test error:', error.message);
  process.exit(1);
}
" && echo "DB Connection OK" || echo "DB Connection FAILED"

echo ""
echo "🚀 Restarting PM2 with fresh config..."
pm2 delete e-evkin-backend 2>/dev/null || true

# Start with environment variables
pm2 start dist/server.js --name e-evkin-backend \
  --max-memory-restart 400M \
  --env NODE_ENV=production \
  --env PORT=5000

echo "⏳ Waiting for startup..."
sleep 5

echo "🏥 Final health check:"
if curl -f -s http://localhost:5000/health; then
    echo ""
    echo "✅ SUCCESS! Backend is working"
    pm2 save
else
    echo ""
    echo "❌ Still failing. Check logs:"
    pm2 logs e-evkin-backend --lines 5
fi