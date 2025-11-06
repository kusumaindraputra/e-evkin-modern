#!/bin/bash

# Manual Database Seeding for E-EVKIN Modern
# Run this script to seed the database with initial data

echo "🌱 E-EVKIN Modern - Manual Database Seeding"
echo "==========================================="

# Check if we're in the right directory
if [ ! -f "src/seeders/seedAll.ts" ]; then
    echo "❌ Must be run from backend directory"
    echo "   cd /www/wwwroot/e-evkin-modern/backend"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    echo "   Make sure environment is set up properly"
    exit 1
fi

echo "🔍 Checking database connection..."

# Test database connection
DB_TEST=$(npx tsx -e "
import { sequelize } from './src/models';
sequelize.authenticate()
  .then(() => console.log('✅ Database connection OK'))
  .catch(err => console.log('❌ Database error:', err.message));
" 2>/dev/null)

echo "$DB_TEST"

if echo "$DB_TEST" | grep -q "❌"; then
    echo ""
    echo "💡 Database connection failed. Check:"
    echo "   - PostgreSQL service: systemctl status postgresql"
    echo "   - Database exists: sudo -u postgres psql -l | grep eevkin"
    echo "   - Environment variables in .env file"
    exit 1
fi

echo ""
echo "🗄️ Current database status:"
echo "─────────────────────────"

# Check existing data
npx tsx -e "
import { Satuan, SumberAnggaran, Kegiatan, SubKegiatan, User } from './src/models';

async function checkData() {
  try {
    const satuanCount = await Satuan.count();
    const sumberCount = await SumberAnggaran.count();
    const kegiatanCount = await Kegiatan.count();
    const subKegiatanCount = await SubKegiatan.count();
    const userCount = await User.count();
    
    console.log(\`📊 Current data count:\`);
    console.log(\`   Satuan: \${satuanCount}\`);
    console.log(\`   Sumber Anggaran: \${sumberCount}\`);
    console.log(\`   Kegiatan: \${kegiatanCount}\`);
    console.log(\`   Sub Kegiatan: \${subKegiatanCount}\`);
    console.log(\`   Users: \${userCount}\`);
    
    if (satuanCount === 0 && sumberCount === 0 && kegiatanCount === 0) {
      console.log('\\n⚠️  Database appears to be empty - seeding needed');
    } else {
      console.log('\\n✅ Database has some data');
    }
  } catch (error) {
    console.log('❌ Error checking data:', error.message);
  }
}

checkData();" 2>/dev/null

echo ""
echo "🌱 Starting database seeding..."
echo "────────────────────────────"

# Run the seeding
npx tsx src/seeders/seedAll.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database seeding completed successfully!"
    echo ""
    echo "🔍 Verifying seeded data..."
    
    # Verify seeded data
    npx tsx -e "
    import { Satuan, SumberAnggaran, Kegiatan, SubKegiatan, User } from './src/models';
    
    async function verifyData() {
      try {
        const satuanCount = await Satuan.count();
        const sumberCount = await SumberAnggaran.count();
        const kegiatanCount = await Kegiatan.count();
        const subKegiatanCount = await SubKegiatan.count();
        const userCount = await User.count();
        
        console.log('📈 Seeded data verification:');
        console.log(\`   ✅ Satuan: \${satuanCount} records\`);
        console.log(\`   ✅ Sumber Anggaran: \${sumberCount} records\`);
        console.log(\`   ✅ Kegiatan: \${kegiatanCount} records\`);
        console.log(\`   ✅ Sub Kegiatan: \${subKegiatanCount} records\`);
        console.log(\`   ✅ Users: \${userCount} records\`);
        
        // Show sample users
        const adminUser = await User.findOne({ where: { username: 'dinkes' } });
        const puskesmasUser = await User.findOne({ where: { username: 'cibinong' } });
        
        console.log('\\n🔐 Sample login credentials:');
        if (adminUser) {
          console.log(\`   👨‍💼 Admin: dinkes / dinkes123 (Role: \${adminUser.role})\`);
        }
        if (puskesmasUser) {
          console.log(\`   🏥 Puskesmas: cibinong / bogorkab (Role: \${puskesmasUser.role})\`);
        }
        
        console.log('\\n🎉 Database is ready for use!');
      } catch (error) {
        console.log('❌ Error verifying data:', error.message);
      }
    }
    
    verifyData();" 2>/dev/null
    
else
    echo "❌ Database seeding failed!"
    echo ""
    echo "🔍 Possible issues:"
    echo "   - Database connection problems"
    echo "   - Missing dependencies"
    echo "   - Permission issues"
    echo ""
    echo "💡 Try:"
    echo "   - Check database status: systemctl status postgresql"
    echo "   - Verify .env configuration"
    echo "   - Run: npm install (to ensure dependencies)"
    exit 1
fi

echo ""
echo "🎯 Next steps:"
echo "──────────────"
echo "1. Test the website: http://103.197.189.168"
echo "2. Login with: dinkes / dinkes123 (admin)"
echo "3. Or login with: cibinong / bogorkab (puskesmas)"
echo "4. Verify all features work correctly"
echo ""
echo "📊 Monitor with:"
echo "   - pm2 logs e-evkin-backend"
echo "   - curl http://103.197.189.168/health"