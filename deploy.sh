#!/bin/bash

# E-EVKIN Modern - Quick Deploy Script for Staging
# Run this script on your staging server

set -e

echo "🚀 E-EVKIN Modern - Staging Deployment"
echo "========================================"

# Variables
APP_DIR="/var/www/e-evkin-modern"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   exit 1
fi

# Navigate to app directory
cd $APP_DIR

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin master

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install

# Backend build
echo "🔨 Building backend..."
cd $BACKEND_DIR
npm run build

# Frontend build
echo "🎨 Building frontend..."
cd $FRONTEND_DIR
npm run build

# Restart backend with PM2
echo "🔄 Restarting backend..."
cd $APP_DIR
pm2 restart e-evkin-backend

# Clear Nginx cache (optional)
# sudo nginx -s reload

echo "✅ Deployment completed successfully!"
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs e-evkin-backend"
