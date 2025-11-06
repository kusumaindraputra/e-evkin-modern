#!/bin/bash

# Fixed Database Seeding for E-EVKIN Modern
# This script will properly seed the database with all required reference data

echo "🔧 E-EVKIN Modern - Fixed Database Seeding"
echo "=========================================="

# Check if we're in backend directory
if [ ! -f "src/seeders/seedAll.ts" ]; then
    echo "❌ Must be run from backend directory"
    echo "   cd /www/wwwroot/e-evkin-modern/backend"
    exit 1
fi

echo "🗄️ Stopping backend process during seeding..."
pm2 stop e-evkin-backend 2>/dev/null || echo "Backend was not running"

echo ""
echo "🌱 Running fixed database seeding..."
echo "This will:"
echo "   1. Drop and recreate all tables"
echo "   2. Seed reference data (Satuan, SumberAnggaran, Kegiatan, SubKegiatan)"
echo "   3. Create admin and puskesmas users"
echo "   4. Import laporan data"
echo ""

# Run the fixed seeding
npx tsx src/seeders/seedAll.ts

SEEDING_RESULT=$?

if [ $SEEDING_RESULT -eq 0 ]; then
    echo ""
    echo "✅ Database seeding completed successfully!"
    
    echo ""
    echo "🚀 Restarting backend process..."
    pm2 start e-evkin-backend 2>/dev/null || pm2 start ../ecosystem.config.js 2>/dev/null || echo "⚠️ Could not restart backend with PM2"
    
    echo ""
    echo "⏳ Waiting for backend to start..."
    sleep 5
    
    echo ""
    echo "🧪 Testing the setup..."
    
    # Test database connection
    echo "🔍 Testing database..."
    DB_TEST=$(npx tsx -e "
    import { Satuan, SumberAnggaran, Kegiatan, SubKegiatan, User } from './src/models';
    
    async function checkData() {
      try {
        const satuanCount = await Satuan.count();
        const sumberCount = await SumberAnggaran.count();
        const kegiatanCount = await Kegiatan.count();
        const subKegiatanCount = await SubKegiatan.count();
        const userCount = await User.count();
        
        console.log('📊 Database verification:');
        console.log(\`   ✅ Satuan: \${satuanCount} records\`);
        console.log(\`   ✅ Sumber Anggaran: \${sumberCount} records\`);
        console.log(\`   ✅ Kegiatan: \${kegiatanCount} records\`);
        console.log(\`   ✅ Sub Kegiatan: \${subKegiatanCount} records\`);
        console.log(\`   ✅ Users: \${userCount} records\`);
        process.exit(0);
      } catch (error) {
        console.log('❌ Database check failed:', error.message);
        process.exit(1);
      }
    }
    
    checkData();" 2>/dev/null)
    
    echo "$DB_TEST"
    
    # Test API health
    echo ""
    echo "🏥 Testing API health..."
    sleep 3
    
    if curl -f -s http://localhost:5000/health > /dev/null; then
        echo "✅ Backend API is healthy"
        
        # Test login
        echo ""
        echo "🔐 Testing admin login..."
        LOGIN_TEST=$(curl -s -X POST http://localhost:5000/api/auth/login \
          -H "Content-Type: application/json" \
          -d '{"username":"dinkes","password":"dinkes123"}' 2>/dev/null)
          
        if echo "$LOGIN_TEST" | grep -q "token"; then
            echo "✅ Admin login successful"
        else
            echo "⚠️ Admin login test failed"
            echo "Response: $LOGIN_TEST"
        fi
        
    else
        echo "⚠️ Backend API health check failed"
        echo "   Check with: pm2 logs e-evkin-backend"
    fi
    
    echo ""
    echo "🎉 SETUP COMPLETE!"
    echo "=================="
    echo "🌐 Website: http://103.197.189.168"
    echo "🔐 Admin Login: dinkes / dinkes123"
    echo "🏥 Puskesmas Login: cibinong / bogorkab"
    echo ""
    echo "📊 Monitor with:"
    echo "   pm2 status"
    echo "   pm2 logs e-evkin-backend"
    echo "   curl http://103.197.189.168/health"
    
else
    echo ""
    echo "❌ Database seeding failed!"
    echo ""
    echo "🔍 Check the errors above and try:"
    echo "   - Verify PostgreSQL is running: systemctl status postgresql"
    echo "   - Check .env configuration"
    echo "   - Ensure dependencies: npm install"
    echo "   - Manual run: npx tsx src/seeders/seedAll.ts"
    exit 1
fi