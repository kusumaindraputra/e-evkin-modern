#!/bin/bash

# E-EVKIN Modern - Generate Secure JWT Secret
# This script generates a secure random JWT secret

echo "🔐 JWT Secret Generator"
echo "======================"
echo ""

# Check if Node.js is available
if command -v node &> /dev/null; then
    echo "Method 1: Node.js crypto (Recommended)"
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    echo "✅ Generated JWT_SECRET:"
    echo "$JWT_SECRET"
    echo ""
    
# Check if OpenSSL is available
elif command -v openssl &> /dev/null; then
    echo "Method 2: OpenSSL"
    JWT_SECRET=$(openssl rand -hex 64)
    echo "✅ Generated JWT_SECRET:"
    echo "$JWT_SECRET"
    echo ""
    
else
    echo "❌ Error: Neither Node.js nor OpenSSL found"
    echo "Please install one of them to generate secure secrets"
    exit 1
fi

echo "📋 Copy the secret above and paste it into your .env file:"
echo "   JWT_SECRET=$JWT_SECRET"
echo ""
echo "💡 Tips:"
echo "   - Keep this secret safe and never commit to git"
echo "   - Use different secrets for dev/staging/production"
echo "   - Store in secure password manager"
echo ""

# Offer to update .env file
read -p "Update backend/.env file now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "backend/.env" ]; then
        # Backup original
        cp backend/.env backend/.env.backup
        
        # Replace JWT_SECRET line
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" backend/.env
        
        echo "✅ backend/.env updated successfully!"
        echo "📄 Backup saved to: backend/.env.backup"
    else
        echo "❌ backend/.env not found"
        echo "💡 Create it first by running: cd backend && ./deploy-backend.sh"
    fi
fi
