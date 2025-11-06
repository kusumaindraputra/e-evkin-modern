#!/bin/bash

# E-EVKIN Modern - Production Environment Setup Script
# This script helps set up secure environment variables for production deployment

set -e

echo "🔒 E-EVKIN Modern - Production Environment Security Setup"
echo "======================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Function to generate secure JWT secret
generate_jwt_secret() {
    if command -v node >/dev/null 2>&1; then
        node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    else
        # Fallback to openssl if Node.js not available
        openssl rand -hex 64
    fi
}

# Function to validate inputs
validate_domain() {
    local domain=$1
    if [[ $domain =~ ^https?://[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.?[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

echo -e "${GREEN}🔍 Checking current environment configuration...${NC}"

# Check current .env file
if [ -f "backend/.env" ]; then
    echo "✅ Found existing .env file"
    
    # Check for insecure defaults
    if grep -q "your-super-secret-jwt-key-change-this-in-production" backend/.env; then
        echo -e "${RED}⚠️  WARNING: Default JWT_SECRET detected!${NC}"
        NEEDS_JWT_UPDATE=true
    fi
    
    if grep -q "CORS_ORIGIN=http://localhost" backend/.env; then
        echo -e "${YELLOW}⚠️  WARNING: Development CORS_ORIGIN detected${NC}"
        NEEDS_CORS_UPDATE=true
    fi
    
    if grep -q "DB_PASSWORD=admin" backend/.env; then
        echo -e "${RED}⚠️  WARNING: Default database password detected!${NC}"
        NEEDS_DB_UPDATE=true
    fi
else
    echo -e "${RED}❌ No .env file found. Creating from template...${NC}"
    cp backend/.env.example backend/.env
    NEEDS_JWT_UPDATE=true
    NEEDS_CORS_UPDATE=true
    NEEDS_DB_UPDATE=true
fi

echo ""
echo -e "${GREEN}🔧 Setting up production environment variables...${NC}"

# Backup current .env
cp backend/.env backend/.env.backup.$(date +%Y%m%d_%H%M%S)
echo "💾 Backup created: backend/.env.backup.$(date +%Y%m%d_%H%M%S)"

# Update NODE_ENV
sed -i 's/NODE_ENV=.*/NODE_ENV=production/' backend/.env
echo "✅ NODE_ENV set to production"

# Generate and update JWT_SECRET
if [ "$NEEDS_JWT_UPDATE" = true ]; then
    echo ""
    echo -e "${GREEN}🔑 Generating secure JWT_SECRET...${NC}"
    JWT_SECRET=$(generate_jwt_secret)
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" backend/.env
    echo "✅ JWT_SECRET updated with 64-character random string"
    echo -e "${YELLOW}🔒 JWT_SECRET: ${JWT_SECRET:0:20}...${NC}"
fi

# Update CORS_ORIGIN
if [ "$NEEDS_CORS_UPDATE" = true ]; then
    echo ""
    echo -e "${GREEN}🌐 Setting up CORS origin...${NC}"
    while true; do
        read -p "Enter your production domain (e.g., https://yourdomain.com): " DOMAIN
        if validate_domain "$DOMAIN"; then
            sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=$DOMAIN|" backend/.env
            echo "✅ CORS_ORIGIN updated to: $DOMAIN"
            break
        else
            echo -e "${RED}❌ Invalid domain format. Please use format: https://yourdomain.com${NC}"
        fi
    done
fi

# Update database password
if [ "$NEEDS_DB_UPDATE" = true ]; then
    echo ""
    echo -e "${GREEN}🗄️ Setting up database password...${NC}"
    echo "Current database user: $(grep DB_USER backend/.env | cut -d'=' -f2)"
    echo "Current database name: $(grep DB_NAME backend/.env | cut -d'=' -f2)"
    
    while true; do
        read -s -p "Enter secure database password (min 8 characters): " DB_PASSWORD
        echo ""
        if [ ${#DB_PASSWORD} -ge 8 ]; then
            sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|" backend/.env
            echo "✅ Database password updated"
            break
        else
            echo -e "${RED}❌ Password too short. Minimum 8 characters required.${NC}"
        fi
    done
fi

# Additional production optimizations
echo ""
echo -e "${GREEN}⚡ Applying production optimizations...${NC}"

# Set production database host if needed
read -p "Database host (press Enter for localhost): " DB_HOST
if [ -n "$DB_HOST" ]; then
    sed -i "s|DB_HOST=.*|DB_HOST=$DB_HOST|" backend/.env
    echo "✅ Database host updated to: $DB_HOST"
fi

# Rate limiting for production (more restrictive)
sed -i 's|RATE_LIMIT_MAX_REQUESTS=.*|RATE_LIMIT_MAX_REQUESTS=60|' backend/.env
echo "✅ Rate limiting set to 60 requests per window (production)"

# JWT expiration for production
sed -i 's|JWT_EXPIRE=.*|JWT_EXPIRE=24h|' backend/.env
echo "✅ JWT expiration set to 24 hours (production)"

echo ""
echo -e "${GREEN}🔍 Verifying configuration...${NC}"

# Display current configuration (masked)
echo "Current production configuration:"
echo "================================="
echo "NODE_ENV: $(grep NODE_ENV backend/.env | cut -d'=' -f2)"
echo "PORT: $(grep PORT backend/.env | cut -d'=' -f2)"
echo "CORS_ORIGIN: $(grep CORS_ORIGIN backend/.env | cut -d'=' -f2)"
echo "DB_HOST: $(grep DB_HOST backend/.env | cut -d'=' -f2)"
echo "DB_NAME: $(grep DB_NAME backend/.env | cut -d'=' -f2)"
echo "DB_USER: $(grep DB_USER backend/.env | cut -d'=' -f2)"
echo "DB_PASSWORD: ******* (hidden)"
echo "JWT_SECRET: $(grep JWT_SECRET backend/.env | cut -d'=' -f2 | cut -c1-20)... (hidden)"
echo "JWT_EXPIRE: $(grep JWT_EXPIRE backend/.env | cut -d'=' -f2)"
echo "RATE_LIMIT_MAX_REQUESTS: $(grep RATE_LIMIT_MAX_REQUESTS backend/.env | cut -d'=' -f2)"

echo ""
echo -e "${GREEN}✅ Production environment setup completed!${NC}"
echo ""
echo -e "${GREEN}🚀 Next steps:${NC}"
echo "1. Review the configuration above"
echo "2. Ensure your database is created and accessible"
echo "3. Run deployment: ./deploy.sh --production"
echo "4. Test the application after deployment"
echo ""
echo -e "${YELLOW}⚠️  Security reminders:${NC}"
echo "- Keep .env file secure (never commit to Git)"
echo "- Use strong database passwords"
echo "- Enable HTTPS/SSL for your domain"
echo "- Monitor logs for security events"
echo ""
echo -e "${GREEN}📚 Documentation:${NC}"
echo "- Security guide: docs/security/SECURITY.md"
echo "- Deployment guide: docs/deployment/DEPLOYMENT_UBUNTU_AAPANEL.md"
echo "- JWT guide: docs/security/JWT_SECRET_GUIDE.md"

# Create environment verification script
cat > backend/verify-env.js << 'EOF'
require('dotenv').config();

console.log('🔍 Environment Verification');
console.log('============================');

const checks = [
    {
        name: 'NODE_ENV',
        value: process.env.NODE_ENV,
        expected: 'production',
        critical: true
    },
    {
        name: 'JWT_SECRET length',
        value: process.env.JWT_SECRET?.length || 0,
        expected: '64+ characters',
        critical: true,
        check: (val) => val >= 64
    },
    {
        name: 'CORS_ORIGIN',
        value: process.env.CORS_ORIGIN,
        expected: 'https:// domain',
        critical: true,
        check: (val) => val && val.startsWith('https://')
    },
    {
        name: 'DB_PASSWORD',
        value: process.env.DB_PASSWORD ? '****' : 'NOT SET',
        expected: 'Set',
        critical: true,
        check: (val) => process.env.DB_PASSWORD && process.env.DB_PASSWORD.length >= 8
    }
];

let allPassed = true;

checks.forEach(check => {
    const passed = check.check ? check.check(check.value) : check.value === check.expected;
    const status = passed ? '✅' : (check.critical ? '❌' : '⚠️');
    
    console.log(`${status} ${check.name}: ${check.value} (expected: ${check.expected})`);
    
    if (!passed && check.critical) {
        allPassed = false;
    }
});

console.log('\n' + (allPassed ? '✅ All critical checks passed!' : '❌ Some critical checks failed!'));
console.log(allPassed ? 'Ready for production deployment!' : 'Please fix the issues above before deploying.');

process.exit(allPassed ? 0 : 1);
EOF

echo ""
echo -e "${GREEN}📋 Environment verification script created: backend/verify-env.js${NC}"
echo "Run with: cd backend && node verify-env.js"

echo ""
echo -e "${GREEN}🎉 Setup complete! Your application is ready for secure production deployment.${NC}"