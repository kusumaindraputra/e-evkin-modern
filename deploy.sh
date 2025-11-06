#!/bin/bash#!/bin/bash#!/bin/bash



# E-EVKIN MODERN - ULTIMATE DEPLOYMENT SCRIPT

# ===========================================

# Comprehensive deployment script for aaPanel Ubuntu servers# E-EVKIN MODERN - ULTIMATE DEPLOYMENT SCRIPT# E-EVKIN Modern - Complete Deployment Script for aaPanel Ubuntu Server

# Handles everything from initial setup to production deployment

# # ===========================================# This script handles EVERYTHING from initial setup to production deployment

# Author: GitHub Copilot

# Version: 1.0 Final# Comprehensive deployment script for aaPanel Ubuntu servers# 

# Date: November 2025

## Handles everything from initial setup to production deployment# Features:

# USAGE:

#   ./deploy.sh --first-time    # Complete initial setup# # - First-time setup (dependencies, database, nginx)

#   ./deploy.sh --update        # Regular update deployment  

#   ./deploy.sh --quick         # Quick code update only# Author: GitHub Copilot# - Regular deployments (git pull, build, restart)

#   ./deploy.sh --seed-only     # Database seeding only

#   ./deploy.sh --restart       # Restart services only# Version: 1.0 Final# - Memory optimization for 2GB servers



set -e# Date: November 2025# - Complete nginx configuration



# ===========================================## - Database setup and seeding

# CONFIGURATION & VARIABLES

# ===========================================# USAGE:# - PM2 process management



APP_NAME="E-EVKIN Modern"#   ./deploy.sh --first-time    # Complete initial setup# - Health checks and validation

APP_DIR="/www/wwwroot/e-evkin-modern"

BACKEND_DIR="$APP_DIR/backend"#   ./deploy.sh --update        # Regular update deployment  #

FRONTEND_DIR="$APP_DIR/frontend"

LOG_FILE="$APP_DIR/deployment.log"#   ./deploy.sh --quick         # Quick code update only# Usage: 

NODE_VERSION="18"

PM2_APP_NAME="e-evkin-backend"#   ./deploy.sh --seed-only     # Database seeding only#   ./deploy.sh --first-time    # First deployment (installs everything)



# Deployment flags#   ./deploy.sh --restart       # Restart services only#   ./deploy.sh                 # Regular deployment (updates only)

FIRST_TIME=false

UPDATE_MODE=false#   ./deploy.sh --quick         # Quick deployment (skip deps)

QUICK_MODE=false

SEED_ONLY=falseset -e

RESTART_ONLY=false

set -e

# Colors for output

RED='\033[0;31m'# ===========================================

GREEN='\033[0;32m'

YELLOW='\033[1;33m'# CONFIGURATION & VARIABLESecho "🚀 E-EVKIN Modern - Complete aaPanel Deployment"

BLUE='\033[0;34m'

PURPLE='\033[0;35m'# ===========================================echo "==============================================="

CYAN='\033[0;36m'

NC='\033[0m' # No Color



# ===========================================APP_NAME="E-EVKIN Modern"# Variables - aaPanel Ubuntu Server Configuration

# UTILITY FUNCTIONS

# ===========================================APP_DIR="/www/wwwroot/e-evkin-modern"APP_DIR="/www/wwwroot/e-evkin-modern"



log() {BACKEND_DIR="$APP_DIR/backend"BACKEND_DIR="$APP_DIR/backend"

    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"

}FRONTEND_DIR="$APP_DIR/frontend"FRONTEND_DIR="$APP_DIR/frontend"



success() {LOG_FILE="$APP_DIR/deployment.log"LOG_FILE="$APP_DIR/deploy.log"

    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"

}NODE_VERSION="18"FIRST_TIME=false



warning() {PM2_APP_NAME="e-evkin-backend"QUICK_DEPLOY=false

    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"

}



error() {# Deployment flags# Parse command line arguments

    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"

}FIRST_TIME=falsewhile [[ $# -gt 0 ]]; do



info() {UPDATE_MODE=false  case $1 in

    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"

}QUICK_MODE=false    --first-time)



header() {SEED_ONLY=false      FIRST_TIME=true

    echo -e "${PURPLE}"

    echo "========================================"RESTART_ONLY=false      shift

    echo "$1"

    echo "========================================"      ;;

    echo -e "${NC}"

}# Colors for output    --quick)



command_exists() {RED='\033[0;31m'      QUICK_DEPLOY=true

    command -v "$1" >/dev/null 2>&1

}GREEN='\033[0;32m'      shift



check_root() {YELLOW='\033[1;33m'      ;;

    if [[ $EUID -ne 0 ]]; then

        error "This script must be run as root on aaPanel servers"BLUE='\033[0;34m'    *)

        echo "Please run: sudo bash deploy.sh"

        exit 1PURPLE='\033[0;35m'      echo "Unknown option $1"

    fi

}CYAN='\033[0;36m'      echo "Usage: $0 [--first-time] [--quick]"



# ===========================================NC='\033[0m' # No Color      echo "  --first-time : Complete first-time setup (database, nginx, etc.)"

# SYSTEM SETUP FUNCTIONS

# ===========================================      echo "  --quick      : Quick deployment (skip dependency installation)"



install_system_dependencies() {# ===========================================      exit 1

    log "Installing system dependencies..."

    # UTILITY FUNCTIONS      ;;

    apt update -qq

    apt install -y curl wget git build-essential nginx postgresql postgresql-contrib software-properties-common# ===========================================  esac

    

    success "System dependencies installed"done

}

log() {

install_nodejs() {

    log "Installing Node.js $NODE_VERSION..."    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"# Check if running as root

    

    if ! command_exists node; then}if [[ $EUID -ne 0 ]]; then

        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -

        apt install -y nodejs   echo "❌ This script must be run as root on aaPanel servers"

    fi

    success() {   echo "   Please run: sudo bash deploy.sh"

    # Update npm and install PM2

    npm install -g npm@latest pm2@latest    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"   exit 1

    

    success "Node.js $(node --version) and PM2 installed"}fi

}



setup_database() {

    log "Setting up PostgreSQL database..."warning() {echo "✅ Running with root privileges on aaPanel server..."

    

    systemctl start postgresql    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"

    systemctl enable postgresql

    }# Function to log with timestamp

    # Create database and user

    sudo -u postgres psql << EOF >/dev/null 2>&1log() {

DO \$\$

BEGINerror() {    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE

    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'eevkin_modern') THEN

        CREATE DATABASE eevkin_modern;    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"}

    END IF;

    }

    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'eevkin_user') THEN

        CREATE USER eevkin_user WITH ENCRYPTED PASSWORD 'eevkin_secure_2024';# Function to check if command exists

        GRANT ALL PRIVILEGES ON DATABASE eevkin_modern TO eevkin_user;

        ALTER USER eevkin_user CREATEDB;info() {command_exists() {

    END IF;

END    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"    command -v "$1" >/dev/null 2>&1

\$\$;

EOF}}

    

    success "PostgreSQL database configured"

}

header() {# FIRST TIME SETUP FUNCTIONS

setup_environment() {

    log "Setting up environment configuration..."    echo -e "${PURPLE}"# ==========================

    

    # Create .env file for backend    echo "========================================"

    cat > "$BACKEND_DIR/.env" << EOF

NODE_ENV=production    echo "$1"install_system_dependencies() {

PORT=5000

DB_HOST=localhost    echo "========================================"    log "📦 Installing system dependencies..."

DB_PORT=5432

DB_NAME=eevkin_modern    echo -e "${NC}"    apt update

DB_USER=eevkin_user

DB_PASSWORD=eevkin_secure_2024}    apt install -y curl wget git build-essential nginx postgresql postgresql-contrib

JWT_SECRET=$(openssl rand -base64 32)

CORS_ORIGIN=http://103.197.189.168    log "✅ System dependencies installed"

EOF

    command_exists() {}

    success "Environment configuration created"

}    command -v "$1" >/dev/null 2>&1



configure_nginx() {}install_nodejs() {

    log "Configuring Nginx..."

        log "📦 Installing Node.js 18..."

    # Remove default site

    rm -f /etc/nginx/sites-enabled/defaultcheck_root() {    if ! command_exists node; then

    

    # Create site configuration    if [[ $EUID -ne 0 ]]; then        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

    cat > "/etc/nginx/sites-available/e-evkin-modern" << 'EOF'

server {        error "This script must be run as root on aaPanel servers"        apt install -y nodejs

    listen 80;

    server_name 103.197.189.168;        echo "Please run: sudo bash deploy.sh"    fi

    

    root /www/wwwroot/e-evkin-modern/frontend/dist;        exit 1    

    index index.html;

    fi    # Install/update npm and PM2

    access_log /var/log/nginx/e-evkin-modern.access.log;

    error_log /var/log/nginx/e-evkin-modern.error.log;}    npm install -g npm@latest pm2@latest



    # Security headers    

    add_header X-Frame-Options "SAMEORIGIN" always;

    add_header X-Content-Type-Options "nosniff" always;# ===========================================    log "✅ Node.js $(node --version) and PM2 installed"

    add_header X-XSS-Protection "1; mode=block" always;

    add_header Referrer-Policy "strict-origin-when-cross-origin" always;# MAIN EXECUTION}



    # API proxy to backend# ===========================================

    location /api/ {

        proxy_pass http://127.0.0.1:5000/api/;setup_database() {

        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;parse_arguments() {    log "🗄️ Setting up PostgreSQL database..."

        proxy_set_header Connection 'upgrade';

        proxy_set_header Host $host;    while [[ $# -gt 0 ]]; do    

        proxy_set_header X-Real-IP $remote_addr;

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;        case $1 in    # Start PostgreSQL service

        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;            --first-time)    systemctl start postgresql

        proxy_connect_timeout 30s;

        proxy_send_timeout 30s;                FIRST_TIME=true    systemctl enable postgresql

        proxy_read_timeout 30s;

    }                shift    



    # Health check endpoint                ;;    # Create database and user

    location /health {

        proxy_pass http://127.0.0.1:5000/health;            --update)    sudo -u postgres psql << EOF

        access_log off;

    }                UPDATE_MODE=trueCREATE DATABASE eevkin_modern;



    # Handle React Router (SPA routing)                shiftCREATE USER eevkin_user WITH ENCRYPTED PASSWORD 'eevkin_secure_2024';

    location / {

        try_files $uri $uri/ /index.html;                ;;GRANT ALL PRIVILEGES ON DATABASE eevkin_modern TO eevkin_user;

    }

            --quick)ALTER USER eevkin_user CREATEDB;

    # Static assets caching

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {                QUICK_MODE=true\q

        expires 30d;

        add_header Cache-Control "public, immutable";                UPDATE_MODE=trueEOF

        access_log off;

    }                shift    



    # Deny access to sensitive files                ;;    log "✅ Database setup completed"

    location ~ /\.(ht|git|env) {

        deny all;            --seed-only)}

        return 404;

    }                SEED_ONLY=true



    # Performance optimizations                shiftsetup_environment() {

    gzip on;

    gzip_vary on;                ;;    log "🔧 Setting up environment configuration..."

    gzip_min_length 1024;

    gzip_comp_level 6;            --restart)    

    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

                    RESTART_ONLY=true    # Create .env file for backend

    client_max_body_size 10M;

    server_tokens off;                shift    cat > "$BACKEND_DIR/.env" << EOF

}

EOF                ;;NODE_ENV=production



    # Enable the site            -h|--help)PORT=5000

    ln -sf "/etc/nginx/sites-available/e-evkin-modern" "/etc/nginx/sites-enabled/e-evkin-modern"

                    show_helpDB_HOST=localhost

    # Test and reload nginx

    nginx -t && systemctl reload nginx                exit 0DB_PORT=5432

    

    success "Nginx configured and reloaded"                ;;DB_NAME=eevkin_modern

}

            *)DB_USER=eevkin_user

# ===========================================

# DATABASE SEEDING FUNCTION                error "Unknown option $1"DB_PASSWORD=eevkin_secure_2024

# ===========================================

                show_helpJWT_SECRET=$(openssl rand -base64 32)

seed_database() {

    log "Seeding database with complete reference data..."                exit 1CORS_ORIGIN=http://103.197.189.168

    

    cd "$BACKEND_DIR"                ;;EOF

    

    # Stop backend during seeding        esac    

    pm2 stop "$PM2_APP_NAME" 2>/dev/null || info "Backend was not running"

        done    log "✅ Environment configuration created"

    # Run the comprehensive seeding

    npx tsx -e "}}

import { sequelize } from './src/config/database';

import User from './src/models/User';

import Laporan from './src/models/Laporan';

import { SumberAnggaran, Satuan, Kegiatan, SubKegiatan } from './src/models';show_help() {seed_database() {

import puskesmasData from './src/seeders/data/puskesmas.json';

import laporanDataRaw from './src/seeders/data/laporan.json';    echo -e "${BLUE}"    log "🌱 Seeding database..."



const laporanData = laporanDataRaw as any[];    echo "E-EVKIN Modern - Ultimate Deployment Script"    cd "$BACKEND_DIR"



async function seedAll() {    echo "==========================================="    

  try {

    console.log('🔄 Starting production database seeding...');    echo ""    # Run database migrations and seeding

    

    await sequelize.sync({ force: true });    echo "USAGE:"    npx tsx src/seeders/seedAll.ts

    console.log('✅ Database synced');

    echo "  ./deploy.sh --first-time    Complete initial setup"    

    // Seed Reference Data

    console.log('📚 Seeding reference data...');    echo "  ./deploy.sh --update        Regular update deployment"      log "✅ Database seeded with initial data"

    

    // Satuan (20 records including id 7 & 8 used in laporan)    echo "  ./deploy.sh --quick         Quick code update only"}

    const satuanData = [

      { id_satuan: 1, satuannya: 'Orang' },    echo "  ./deploy.sh --seed-only     Database seeding only"

      { id_satuan: 2, satuannya: 'Dokumen' },

      { id_satuan: 3, satuannya: 'unit kerja' },    echo "  ./deploy.sh --restart       Restart services only"configure_nginx() {

      { id_satuan: 4, satuannya: 'Kali' },

      { id_satuan: 5, satuannya: 'Rumah' },    echo "  ./deploy.sh --help          Show this help"    log "🌐 Configuring Nginx..."

      { id_satuan: 6, satuannya: 'Unit' },

      { id_satuan: 7, satuannya: 'Laporan' },    echo ""    

      { id_satuan: 8, satuannya: 'Kegiatan' },

      { id_satuan: 9, satuannya: 'Paket' },    echo "EXAMPLES:"    # Remove default site

      { id_satuan: 10, satuannya: 'Buah' },

      { id_satuan: 11, satuannya: 'Set' },    echo "  ./deploy.sh --first-time    # Initial deployment"    rm -f /etc/nginx/sites-enabled/default

      { id_satuan: 12, satuannya: 'Item' },

      { id_satuan: 13, satuannya: 'Meter' },    echo "  ./deploy.sh --update        # Regular updates"    

      { id_satuan: 14, satuannya: 'Kilogram' },

      { id_satuan: 15, satuannya: 'Liter' },    echo "  ./deploy.sh --quick         # Fast updates"    # Create our site configuration

      { id_satuan: 16, satuannya: 'Jam' },

      { id_satuan: 17, satuannya: 'Hari' },    echo -e "${NC}"    cat > "/etc/nginx/sites-available/e-evkin-modern" << 'EOF'

      { id_satuan: 18, satuannya: 'Minggu' },

      { id_satuan: 19, satuannya: 'Bulan' },}server {

      { id_satuan: 20, satuannya: 'Tahun' },

    ];    listen 80;

    for (const satuan of satuanData) {

      await Satuan.findOrCreate({ where: { id_satuan: satuan.id_satuan }, defaults: satuan });main() {    server_name 103.197.189.168;

    }

    console.log(\`✅ Seeded \${satuanData.length} satuan records\`);    # Parse command line arguments    



    // Sumber Anggaran    parse_arguments "$@"    root /www/wwwroot/e-evkin-modern/frontend/dist;

    const sumberAnggaranData = [

      { id_sumber: 1, sumber: 'BLUD Puskesmas' },        index index.html;

      { id_sumber: 2, sumber: 'DAK Non Fisik' },

      { id_sumber: 3, sumber: 'APBD' },    # Show help if no arguments

      { id_sumber: 4, sumber: 'JKN (Dana Kapitasi)' },

      { id_sumber: 5, sumber: 'APBN' },    if [ "$FIRST_TIME" = false ] && [ "$UPDATE_MODE" = false ] && [ "$SEED_ONLY" = false ] && [ "$RESTART_ONLY" = false ]; then    access_log /var/log/nginx/e-evkin-modern.access.log;

      { id_sumber: 6, sumber: 'Bantuan Luar Negeri' },

      { id_sumber: 7, sumber: 'Swasta' },        show_help    error_log /var/log/nginx/e-evkin-modern.error.log;

      { id_sumber: 8, sumber: 'Lainnya' },

    ];        exit 0

    for (const sumber of sumberAnggaranData) {

      await SumberAnggaran.findOrCreate({ where: { id_sumber: sumber.id_sumber }, defaults: sumber });    fi    # Security headers

    }

    console.log(\`✅ Seeded \${sumberAnggaranData.length} sumber anggaran records\`);        add_header X-Frame-Options "SAMEORIGIN" always;



    // Kegiatan    header "$APP_NAME - ULTIMATE DEPLOYMENT"    add_header X-Content-Type-Options "nosniff" always;

    const kegiatanData = [

      { id_kegiatan: 1, id_uraian: 2, kode: '1.02.01.2.10', kegiatan: 'Peningkatan Pelayanan BLUD' },    log "Starting deployment with selected options..."    add_header X-XSS-Protection "1; mode=block" always;

      { id_kegiatan: 2, id_uraian: 3, kode: '1.02.02.2.02', kegiatan: 'Penyediaan Layanan Kesehatan untuk UKM dan UKP Rujukan Tingkat Daerah Kabupaten/Kota' },

      { id_kegiatan: 3, id_uraian: 4, kode: '1.02.03.2.02', kegiatan: 'Perencanaan Kebutuhan dan Pendayagunaan Sumberdaya Manusia Kesehatan untuk UKP dan UKM di Wilayah Kabupaten/Kota' },        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

      { id_kegiatan: 4, id_uraian: 5, kode: '1.02.05.2.03', kegiatan: 'Pengembangan dan Pelaksanaan Upaya Kesehatan Bersumber Daya Masyarakat (UKBM) Tingkat Daerah Kabupaten/Kota' },

      { id_kegiatan: 5, id_uraian: 3, kode: '1.02.02.2.03', kegiatan: 'Penyelenggaraan Sistem Informasi Kesehatan Secara Terintegrasi' },    success "Deployment script completed successfully!"

    ];

    for (const kegiatan of kegiatanData) {}    # API proxy to backend

      await Kegiatan.findOrCreate({ where: { id_kegiatan: kegiatan.id_kegiatan }, defaults: kegiatan });

    }    location /api/ {

    console.log(\`✅ Seeded \${kegiatanData.length} kegiatan records\`);

# Execute main function with all arguments        proxy_pass http://127.0.0.1:5000/api/;

    // Sub Kegiatan (ALL 46 used in laporan data)

    const subKegiatanData = [main "$@"        proxy_http_version 1.1;

      { id_sub_kegiatan: 1, id_kegiatan: 1, kode_sub: '1.02.01.2.10.0001', kegiatan: 'Pelayanan dan Penunjang Pelayanan BLUD', indikator_kinerja: 'Jumlah BLUD yang menyediakan pelayanan dan penunjang pelayanan' },        proxy_set_header Upgrade $http_upgrade;

      { id_sub_kegiatan: 2, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0001', kegiatan: 'Pengelolaan Pelayanan Kesehatan Ibu Hamil', indikator_kinerja: 'Jumlah ibu hamil yang mendapatkan pelayanan kesehatan sesuai standar' },        proxy_set_header Connection 'upgrade';

      { id_sub_kegiatan: 4, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0002', kegiatan: 'Pengelolaan Pelayanan Kesehatan Ibu Bersalin', indikator_kinerja: 'Jumlah ibu bersalin yang mendapatkan pelayanan kesehatan sesuai standar' },        proxy_set_header Host $host;

      { id_sub_kegiatan: 5, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0003', kegiatan: 'Pengelolaan Pelayanan Kesehatan Bayi Baru Lahir', indikator_kinerja: 'Jumlah bayi baru lahir yang mendapatkan pelayanan kesehatan sesuai standar' },        proxy_set_header X-Real-IP $remote_addr;

      { id_sub_kegiatan: 6, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0004', kegiatan: 'Pengelolaan Pelayanan Kesehatan Balita', indikator_kinerja: 'Jumlah balita yang mendapatkan pelayanan kesehatan sesuai standar' },        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

      { id_sub_kegiatan: 7, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0005', kegiatan: 'Pengelolaan Pelayanan Kesehatan pada Usia Pendidikan Dasar', indikator_kinerja: 'Jumlah anak usia pendidikan dasar yang mendapatkan pelayanan kesehatan sesuai standar' },        proxy_set_header X-Forwarded-Proto $scheme;

      { id_sub_kegiatan: 8, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0006', kegiatan: 'Pengelolaan Pelayanan Kesehatan pada Usia Produktif', indikator_kinerja: 'Jumlah usia produktif yang mendapatkan pelayanan kesehatan sesuai standar' },        proxy_cache_bypass $http_upgrade;

      { id_sub_kegiatan: 9, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0007', kegiatan: 'Pengelolaan Pelayanan Kesehatan pada Usia Lanjut', indikator_kinerja: 'Jumlah usia lanjut yang mendapatkan pelayanan kesehatan sesuai standar' },        proxy_connect_timeout 30s;

      { id_sub_kegiatan: 10, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0008', kegiatan: 'Pengelolaan Pelayanan Kesehatan Penderita Hipertensi', indikator_kinerja: 'Jumlah penderita hipertensi yang mendapatkan pelayanan kesehatan sesuai standar' },        proxy_send_timeout 30s;

      { id_sub_kegiatan: 11, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0009', kegiatan: 'Pengelolaan Pelayanan Kesehatan Penderita Diabetes Melitus', indikator_kinerja: 'Jumlah penderita diabetes melitus yang mendapatkan pelayanan kesehatan sesuai standar' },        proxy_read_timeout 30s;

      { id_sub_kegiatan: 12, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0010', kegiatan: 'Pengelolaan Pelayanan Kesehatan Orang dengan Gangguan Jiwa Berat', indikator_kinerja: 'Jumlah orang dengan gangguan jiwa berat yang mendapatkan pelayanan kesehatan sesuai standar' },    }

      { id_sub_kegiatan: 13, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0011', kegiatan: 'Pengelolaan Pelayanan Kesehatan Orang Terduga Tuberkulosis', indikator_kinerja: 'Jumlah orang terduga menderita tuberkulosis yang mendapatkan pelayanan sesuai standar' },

      { id_sub_kegiatan: 14, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0012', kegiatan: 'Pengelolaan Pelayanan Kesehatan Orang dengan Risiko Terinfeksi HIV', indikator_kinerja: 'Jumlah orang terduga menderita HIV yang mendapatkan pelayanan sesuai standar' },    # Health check endpoint

      { id_sub_kegiatan: 15, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0013', kegiatan: 'Pengelolaan Pelayanan Kesehatan Orang dengan Risiko Terinfeksi IMS', indikator_kinerja: 'Jumlah orang dengan risiko terinfeksi IMS yang mendapatkan pelayanan kesehatan sesuai standar' },    location /health {

      { id_sub_kegiatan: 16, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0014', kegiatan: 'Pengelolaan Pelayanan Kesehatan Orang Terduga Penderita Malaria', indikator_kinerja: 'Jumlah orang terduga penderita malaria yang mendapatkan pelayanan kesehatan sesuai standar' },        proxy_pass http://127.0.0.1:5000/health;

      { id_sub_kegiatan: 17, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0015', kegiatan: 'Pengelolaan Pelayanan Kesehatan Gizi Masyarakat', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan pelayanan kesehatan gizi masyarakat' },        access_log off;

      { id_sub_kegiatan: 18, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0016', kegiatan: 'Pengelolaan Pelayanan Kesehatan Kerja dan Olahraga', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan pelayanan kesehatan kerja dan olahraga' },    }

      { id_sub_kegiatan: 19, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0017', kegiatan: 'Pengelolaan Pelayanan Kesehatan Lingkungan', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan pelayanan kesehatan lingkungan' },

      { id_sub_kegiatan: 20, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0018', kegiatan: 'Pengelolaan Pelayanan Promosi Kesehatan', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan pelayanan promosi kesehatan' },    # Handle React Router (SPA routing)

      { id_sub_kegiatan: 21, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0019', kegiatan: 'Pengelolaan Upaya Pencegahan dan Pengendalian Penyakit', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan upaya pencegahan dan pengendalian penyakit' },    location / {

      { id_sub_kegiatan: 22, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0020', kegiatan: 'Pengelolaan Surveilans Kesehatan', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan pelayanan surveilans kesehatan' },        try_files $uri $uri/ /index.html;

      { id_sub_kegiatan: 23, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0021', kegiatan: 'Pengelolaan Pelayanan Kesehatan Jiwa', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan pelayanan kesehatan jiwa' },    }

      { id_sub_kegiatan: 24, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0022', kegiatan: 'Pengelolaan Kemitraan Kesehatan', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan kemitraan kesehatan' },

      { id_sub_kegiatan: 25, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0025', kegiatan: 'Pelayanan Kesehatan Penyakit Menular dan Tidak Menular', indikator_kinerja: 'Jumlah dokumen hasil pelayanan kesehatan penyakit menular dan tidak menular' },    # Static assets caching

      { id_sub_kegiatan: 26, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0026', kegiatan: 'Penyelenggaraan Laboratorium Kesehatan', indikator_kinerja: 'Jumlah dokumen hasil penyelenggaraan laboratorium kesehatan' },    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {

      { id_sub_kegiatan: 27, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0027', kegiatan: 'Penyelenggaraan Kefarmasian', indikator_kinerja: 'Jumlah dokumen hasil penyelenggaraan kefarmasian' },        expires 30d;

      { id_sub_kegiatan: 28, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0028', kegiatan: 'Penyelenggaraan Pelayanan Darah', indikator_kinerja: 'Jumlah dokumen hasil penyelenggaraan pelayanan darah' },        add_header Cache-Control "public, immutable";

      { id_sub_kegiatan: 30, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0033', kegiatan: 'Operasional Pelayanan Puskesmas', indikator_kinerja: 'Jumlah laporan operasional pelayanan puskesmas' },        access_log off;

      { id_sub_kegiatan: 31, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0034', kegiatan: 'Operasional Pelayanan Fasilitas Kesehatan Lainnya', indikator_kinerja: 'Jumlah dokumen operasional fasilitas kesehatan lainnya' },    }

      { id_sub_kegiatan: 33, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0036', kegiatan: 'Investigasi Awal Kejadian Tidak Diharapkan (Kejadian Ikutan Pasca Imunisasi dan Pemberian Obat Massal)', indikator_kinerja: 'Jumlah laporan hasil investigasi awal kejadian tidak diharapkan (kejadian ikutan pasca imunisasi dan pemberian obat massal)' },

      { id_sub_kegiatan: 34, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0037', kegiatan: 'Pelayanan Kesehatan Tradisional', indikator_kinerja: 'Jumlah dokumen pelayanan kesehatan tradisional' },    # Deny access to sensitive files

      { id_sub_kegiatan: 35, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0038', kegiatan: 'Pengelolaan Kesehatan Haji', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan kesehatan haji' },    location ~ /\.(ht|git|env) {

      { id_sub_kegiatan: 36, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0039', kegiatan: 'Pengelolaan Kesehatan dalam Situasi Krisis Kesehatan', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan kesehatan dalam situasi krisis kesehatan' },        deny all;

      { id_sub_kegiatan: 37, id_kegiatan: 4, kode_sub: '1.02.05.2.03.0001', kegiatan: 'Bimbingan Teknis dan Supervisi Pengembangan dan Pelaksanaan Upaya Kesehatan Bersumber Daya Masyarakat (UKBM)', indikator_kinerja: 'Jumlah peserta yang mendapatkan Bimbingan Teknis dan Supervisi Pengembangan dan Pelaksanaan Upaya Kesehatan Bersumber Daya Masyarakat (UKBM)' },        return 404;

      { id_sub_kegiatan: 38, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0040', kegiatan: 'Pengelolaan kesehatan Orang dengan Tuberkulosis', indikator_kinerja: 'Jumlah orang dengan Tuberkulosis yang mendapatkan pelayanan kesehatan sesuai standar' },    }

      { id_sub_kegiatan: 39, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0041', kegiatan: 'Pengelolaan pelayanan kesehatan orang dengan HIV (ODHIV)', indikator_kinerja: 'Jumlah orang dengan HIV (ODHIV) yang mendapatkan pelayanan kesehatan sesuai standar' },

      { id_sub_kegiatan: 40, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0042', kegiatan: 'Pengelolaan pelayanan kesehatan Malaria', indikator_kinerja: 'Jumlah orang yang mendapatkan pelayanan kesehatan malaria' },    # Performance optimizations

      { id_sub_kegiatan: 41, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0044', kegiatan: 'Pengelolaan Pelayanan Kesehatan Reproduksi', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan pelayanan kesehatan reproduksi' },    gzip on;

      { id_sub_kegiatan: 42, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0046', kegiatan: 'Pengelolaan upaya kesehatan Ibu dan Anak', indikator_kinerja: 'Jumlah dokumen hasil pengelolaan upaya kesehatan ibu dan anak' },    gzip_vary on;

      { id_sub_kegiatan: 43, id_kegiatan: 5, kode_sub: '1.02.02.2.03.0002', kegiatan: 'Pengelolaan Sistem Informasi Kesehatan', indikator_kinerja: 'Jumlah Dokumen Hasil Pengelolaan Sistem Informasi Kesehatan' },    gzip_min_length 1024;

      { id_sub_kegiatan: 44, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0010', kegiatan: 'Pengelolaan Pelayanan Kesehatan Orang dengan Gangguan Jiwa Berat', indikator_kinerja: 'Jumlah Orang yang Mendapatkan Pelayanan Kesehatan Orang dengan Gangguan Jiwa Berat Sesuai Standar' },    gzip_comp_level 6;

      { id_sub_kegiatan: 45, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0016', kegiatan: 'Pengelolaan Pelayanan Kesehatan Kerja dan Olahraga', indikator_kinerja: 'Jumlah Dokumen Hasil Pengelolaan Pelayanan Kesehatan Kerja dan Olahraga' },    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

      { id_sub_kegiatan: 46, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0021', kegiatan: 'Pengelolaan Pelayanan Kesehatan Orang dengan Masalah Kesehatan Jiwa (ODMK)', indikator_kinerja: 'Jumlah Orang dengan Masalah Kejiwaan (ODMK) yang Mendapatkan Pelayanan Kesehatan' },    

      { id_sub_kegiatan: 47, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0042', kegiatan: 'Pengelolaan pelayanan kesehatan Malaria', indikator_kinerja: 'Jumlah orang yang mendapatkan pelayanan kesehatan malaria' },    client_max_body_size 10M;

      { id_sub_kegiatan: 48, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0047', kegiatan: 'Pengelolaan Pelayanan Kelanjut Usiaan', indikator_kinerja: 'Jumlah Penduduk Usia Lanjut yang Mendapatkan Pelayanan Kesehatan Sesuai Standar' },    server_tokens off;

      { id_sub_kegiatan: 49, id_kegiatan: 2, kode_sub: '1.02.02.2.02.0048', kegiatan: 'Pengelolaan Pelayanan Imunisasi', indikator_kinerja: 'Jumlah Dokumen Hasil Pengelolaan Layanan Imunisasi' },}

    ];EOF

    for (const subKegiatan of subKegiatanData) {

      await SubKegiatan.findOrCreate({ where: { id_sub_kegiatan: subKegiatan.id_sub_kegiatan }, defaults: subKegiatan });    # Enable the site

    }    ln -sf "/etc/nginx/sites-available/e-evkin-modern" "/etc/nginx/sites-enabled/e-evkin-modern"

    console.log(\`✅ Seeded \${subKegiatanData.length} sub kegiatan records\`);    

    # Test and reload nginx

    // Create Admin User    nginx -t && systemctl reload nginx

    const admin = await User.create({    

      username: 'dinkes',    log "✅ Nginx configured and reloaded"

      password: 'dinkes123',}

      nama: 'Administrator Dinkes',

      role: 'admin',# DEPLOYMENT FUNCTIONS

    });# ===================

    console.log(\`✅ Admin created: \${admin.username}\`);

# Check required tools

    // Create Puskesmas Userslog "🔍 Checking system requirements..."

    const puskesmasUsers = [];

    for (const puskesmas of puskesmasData) {# For first time setup, we'll install missing tools

      const user = await User.create({if [ "$FIRST_TIME" = true ]; then

        username: puskesmas.username,    log "🎯 First-time setup detected - installing all requirements..."

        password: puskesmas.password,    

        nama: puskesmas.nama,    # Check if app directory exists, create if needed

        nama_puskesmas: puskesmas.nama,    if [ ! -d "$APP_DIR" ]; then

        role: 'puskesmas',        log "📁 Creating application directory: $APP_DIR"

        id_blud: puskesmas.id_blud || '',        mkdir -p "$APP_DIR"

        kecamatan: puskesmas.kecamatan || '',        cd "$APP_DIR"

        wilayah: puskesmas.wilayah || '',        

      });        # Clone or initialize git repository

      puskesmasUsers.push({ oldId: puskesmas.id, newId: user.id, username: user.username });        if [ ! -d ".git" ]; then

    }            log "📥 Initializing git repository..."

    console.log(\`✅ Created \${puskesmasUsers.length} puskesmas users\`);            git init

            # You would typically clone from your repository here

    // Create ID mapping and seed laporan data            # git clone https://github.com/kusumaindraputra/e-evkin-modern.git .

    const idMapping = {};        fi

    puskesmasUsers.forEach(p => { idMapping[p.oldId] = p.newId; });    fi

    

    let laporanCount = 0;    # Install system dependencies

    let skippedCount = 0;    install_system_dependencies

        install_nodejs

    for (const laporan of laporanData) {    setup_database

      try {    setup_environment

        const userId = idMapping[laporan.puskesmas_id];    

        if (!userId) { skippedCount++; continue; }else

    # Regular deployment - check if tools exist

        const satuanId = Number(laporan.satuan) || 0;    required_tools=("git" "node" "npm" "pm2" "nginx")

        const subKegiatanId = laporan.id_sub_kegiatan || 0;    for tool in "${required_tools[@]}"; do

        if (satuanId === 0 || subKegiatanId === 0) { skippedCount++; continue; }        if ! command_exists $tool; then

            echo "❌ Required tool '$tool' is not installed"

        await Laporan.create({            echo "   Run with --first-time flag for initial setup"

          user_id: userId,            exit 1

          id_kegiatan: laporan.id_kegiatan || 0,        fi

          id_sub_kegiatan: subKegiatanId,    done

          id_sumber_anggaran: Number(laporan.sumber_anggaran) || 1,fi

          id_satuan: satuanId,

          target_k: laporan.target_k || 0,# Ensure we're in the app directory

          angkas: laporan.angkas || 0,cd "$APP_DIR"

          target_rp: laporan.target_rp || 0,log "📂 Working directory: $(pwd)"

          realisasi_k: laporan.realisasi_k || 0,

          realisasi_rp: laporan.realisasi_rp || 0,# Git operations (if not first time)

          permasalahan: laporan.permasalahan || '',if [ "$FIRST_TIME" = false ]; then

          upaya: laporan.upaya || '',    log "📥 Updating code from Git..."

          bulan: laporan.bulan || '',    git fetch origin

          tahun: laporan.tahun || 2022,    git reset --hard origin/$(git branch --show-current)

        });    log "✅ Code updated"

        laporanCount++;fi

        

        if (laporanCount % 2000 === 0) {# Memory-optimized dependency installation

          process.stdout.write(\`\\r   Progress: \${laporanCount} records created...\`);install_dependencies() {

        }    log "📦 Installing dependencies with memory optimization..."

      } catch (error) {    

        skippedCount++;    # Set memory limits for Node.js operations

      }    export NODE_OPTIONS="--max-old-space-size=1024"

    }    

        # Root dependencies

    console.log(\`\\n✅ Created \${laporanCount} laporan records\`);    if [ "$QUICK_DEPLOY" = false ]; then

    if (skippedCount > 0) console.log(\`⚠️  Skipped \${skippedCount} invalid records\`);        npm ci --only=production --no-audit --prefer-offline

        log "✅ Root dependencies installed"

    console.log('🎉 Production database seeding completed!');    fi

    console.log(\`📊 Total records: \${75 + 1 + puskesmasUsers.length + laporanCount}\`);    

        # Backend dependencies

    await sequelize.close();    cd "$BACKEND_DIR"

    process.exit(0);    if [ "$QUICK_DEPLOY" = false ]; then

  } catch (error) {        npm ci --no-audit --prefer-offline

    console.error('❌ Seeding failed:', error);        log "✅ Backend dependencies installed"

    await sequelize.close();    fi

    process.exit(1);    

  }    # Frontend dependencies  

}    cd "$FRONTEND_DIR"

    if [ "$QUICK_DEPLOY" = false ]; then

seedAll();        npm ci --no-audit --prefer-offline

"        log "✅ Frontend dependencies installed"

        fi

    success "Database seeded successfully"}

}

# Build applications with memory optimization

# ===========================================build_applications() {

# APPLICATION BUILD FUNCTIONS    log "🔨 Building applications..."

# ===========================================    

    # Backend build

install_dependencies() {    cd "$BACKEND_DIR"

    log "Installing application dependencies..."    rm -rf dist/

        

    # Set memory limits for Node.js operations    # Memory-optimized TypeScript compilation

    export NODE_OPTIONS="--max-old-space-size=1024"    export NODE_OPTIONS="--max-old-space-size=1024"

        if ! npx tsc; then

    # Root dependencies        log "⚠️ TypeScript compilation failed with 1024MB, trying 768MB..."

    if [ "$QUICK_MODE" = false ]; then        export NODE_OPTIONS="--max-old-space-size=768"

        cd "$APP_DIR"        npx tsc

        npm ci --only=production --no-audit --prefer-offline    fi

            

        # Backend dependencies    if [ ! -f "dist/server.js" ]; then

        cd "$BACKEND_DIR"        log "❌ Backend build failed"

        npm ci --no-audit --prefer-offline        exit 1

            fi

        # Frontend dependencies      log "✅ Backend built successfully"

        cd "$FRONTEND_DIR"    

        npm ci --no-audit --prefer-offline    # Frontend build

            cd "$FRONTEND_DIR"

        success "Dependencies installed"    rm -rf dist/

    else    npm run build

        info "Skipping dependency installation (quick mode)"    

    fi    if [ ! -f "dist/index.html" ]; then

}        log "❌ Frontend build failed"

        exit 1

build_applications() {    fi

    log "Building applications..."    

        BUILD_SIZE=$(du -sh dist/ | cut -f1)

    # Backend build    log "✅ Frontend built successfully (Size: $BUILD_SIZE)"

    cd "$BACKEND_DIR"}

    rm -rf dist/

    # PM2 process management

    # Memory-optimized TypeScript compilationmanage_backend_process() {

    export NODE_OPTIONS="--max-old-space-size=1024"    log "� Managing backend process..."

    if ! npx tsc; then    cd "$APP_DIR"

        warning "TypeScript compilation failed with 1024MB, trying 768MB..."    

        export NODE_OPTIONS="--max-old-space-size=768"    # Stop existing process

        npx tsc    pm2 stop e-evkin-backend 2>/dev/null || log "⚠️ Backend was not running"

    fi    

        # Start backend

    if [ ! -f "dist/server.js" ]; then    pm2 start "$BACKEND_DIR/dist/server.js" --name "e-evkin-backend" \

        error "Backend build failed"        --cwd "$BACKEND_DIR" \

        exit 1        --env "NODE_ENV=production" \

    fi        --max-memory-restart 1500M \

    success "Backend built successfully"        --node-args="--max-old-space-size=1024"

        

    # Frontend build    # Save PM2 configuration

    cd "$FRONTEND_DIR"    pm2 save

    rm -rf dist/    

    npm run build    log "✅ Backend process started with PM2"

    }

    if [ ! -f "dist/index.html" ]; then

        error "Frontend build failed"# Health checks

        exit 1perform_health_checks() {

    fi    log "🏥 Performing health checks..."

        

    BUILD_SIZE=$(du -sh dist/ | cut -f1)    # Wait for backend to start

    success "Frontend built successfully (Size: $BUILD_SIZE)"    sleep 10

}    

    # Backend health check

# ===========================================    for i in {1..30}; do

# SERVICE MANAGEMENT FUNCTIONS        if curl -f -s http://localhost:5000/health > /dev/null; then

# ===========================================            log "✅ Backend health check passed"

            break

manage_backend_process() {        fi

    log "Managing backend process..."        

            if [ $i -eq 30 ]; then

    cd "$APP_DIR"            log "❌ Backend health check failed after 30 attempts"

                log "📝 PM2 logs:"

    # Stop existing process            pm2 logs e-evkin-backend --lines 10 --nostream

    pm2 stop "$PM2_APP_NAME" 2>/dev/null || info "Backend was not running"            exit 1

            fi

    # Start backend        

    pm2 start "$BACKEND_DIR/dist/server.js" --name "$PM2_APP_NAME" \        sleep 2

        --cwd "$BACKEND_DIR" \    done

        --env "NODE_ENV=production" \    

        --max-memory-restart 1500M \    # Nginx check

        --node-args="--max-old-space-size=1024"    if nginx -t 2>/dev/null; then

            log "✅ Nginx configuration is valid"

    # Save PM2 configuration    else

    pm2 save        log "❌ Nginx configuration has errors"

            exit 1

    success "Backend process started with PM2"    fi

}    

    # Frontend accessibility check

perform_health_checks() {    if curl -f -s http://localhost/ > /dev/null; then

    log "Performing health checks..."        log "✅ Frontend is accessible"

        else

    # Wait for backend to start        log "⚠️ Frontend accessibility check failed"

    sleep 10    fi

    }

    # Backend health check

    for i in {1..30}; do# MAIN DEPLOYMENT LOGIC

        if curl -f -s http://localhost:5000/health > /dev/null; then# ====================

            success "Backend health check passed"

            breaklog "🚀 Starting deployment process..."

        fi

        # Install dependencies

        if [ $i -eq 30 ]; theninstall_dependencies

            error "Backend health check failed after 30 attempts"

            pm2 logs "$PM2_APP_NAME" --lines 10 --nostream# Build applications

            exit 1build_applications

        fi

        # First-time database setup

        sleep 2if [ "$FIRST_TIME" = true ]; then

    done    seed_database

        configure_nginx

    # Nginx checkfi

    if nginx -t 2>/dev/null; then

        success "Nginx configuration is valid"# Manage backend process

    elsemanage_backend_process

        error "Nginx configuration has errors"

        exit 1# Reload nginx for regular deployments

    fiif [ "$FIRST_TIME" = false ]; then

        log "🔄 Reloading Nginx..."

    # Frontend accessibility check    nginx -s reload

    if curl -f -s http://localhost/ > /dev/null; then    log "✅ Nginx reloaded"

        success "Frontend is accessible"fi

    else

        warning "Frontend accessibility check failed"# Health checks

    fiperform_health_checks

}

# Final status and summary

restart_services() {log "📊 Final deployment status..."

    log "Restarting services..."pm2 list

    

    # Restart backend# Print comprehensive deployment summary

    pm2 restart "$PM2_APP_NAME"echo ""

    echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"

    # Reload nginxecho "===================================="

    systemctl reload nginxecho "📅 Date: $(date)"

    echo "🏠 Directory: $APP_DIR"

    success "Services restarted"echo "🔧 Backend: Running with PM2 on port 5000"

}echo "� Frontend: Served by Nginx on port 80" 

echo "�️ Database: PostgreSQL with seeded data"

print_summary() {echo ""

    header "DEPLOYMENT SUMMARY"echo "🌐 ACCESS URLS:"

    echo "──────────────"

    echo -e "${GREEN}"echo "✅ Website: http://103.197.189.168"

    echo "🎉 $APP_NAME deployment completed successfully!"echo "✅ API: http://103.197.189.168/api/"

    echo ""echo "✅ Health: http://103.197.189.168/health"

    echo "📊 System Information:"echo ""

    echo "   • Server: 103.197.189.168 (Ubuntu 24.04, 2GB RAM)"echo "🔐 LOGIN CREDENTIALS:"

    echo "   • Backend: Node.js + PM2 (Port 5000)"echo "────────────────────"

    echo "   • Frontend: React + Nginx (Port 80)"echo "👨‍💼 Admin: dinkes / dinkes123"

    echo "   • Database: PostgreSQL"echo "🏥 Puskesmas: cibinong / bogorkab"

    echo ""echo ""

    echo "🌐 Access URLs:"echo "📊 MONITORING COMMANDS:"

    echo "   • Website: http://103.197.189.168"echo "──────────────────────"

    echo "   • API: http://103.197.189.168/api/"echo "� PM2 Status: pm2 status"

    echo "   • Health: http://103.197.189.168/health"echo "📝 Backend Logs: pm2 logs e-evkin-backend"

    echo ""echo "� Nginx Status: systemctl status nginx"

    echo "🔐 Login Credentials:"echo "�️ DB Status: systemctl status postgresql"

    echo "   • Admin: dinkes / dinkes123"echo ""

    echo "   • Puskesmas: cibinong / bogorkab"echo "🔧 MAINTENANCE COMMANDS:"

    echo ""echo "───────────────────────"

    echo "📊 Monitoring Commands:"echo "🔄 Regular Deploy: bash deploy.sh"

    echo "   • PM2 Status: pm2 status"echo "⚡ Quick Deploy: bash deploy.sh --quick"

    echo "   • Backend Logs: pm2 logs $PM2_APP_NAME"echo "🆕 Fresh Setup: bash deploy.sh --first-time"

    echo "   • Nginx Status: systemctl status nginx"echo ""

    echo "   • Database Status: systemctl status postgresql"

    echo ""if [ "$FIRST_TIME" = true ]; then

    echo "🔧 Maintenance Commands:"    echo "🚀 FIRST-TIME SETUP COMPLETED!"

    echo "   • Regular Update: ./deploy.sh --update"    echo "✅ All services installed and configured"

    echo "   • Quick Update: ./deploy.sh --quick"    echo "✅ Database created and seeded"

    echo "   • Restart Services: ./deploy.sh --restart"    echo "✅ Nginx configured for production"

    echo "   • Seed Database: ./deploy.sh --seed-only"    echo "✅ PM2 process management enabled"

    echo -e "${NC}"    echo "✅ Application fully functional"

        echo ""

    log "Deployment completed at $(date)"    echo "🎯 Next Steps:"

    success "All systems operational!"    echo "1. Visit http://103.197.189.168 to test the application"

}    echo "2. Login with the credentials above"

    echo "3. Verify all features work correctly"

# ===========================================    echo "4. Set up SSL certificate if needed"

# ARGUMENT PARSING & MAIN LOGIC    echo "5. Configure domain name if applicable"

# ===========================================else

    echo "🔄 REGULAR DEPLOYMENT COMPLETED!"

parse_arguments() {    echo "✅ Code updated and applications rebuilt"

    while [[ $# -gt 0 ]]; do    echo "✅ Services restarted and health checked"

        case $1 in    echo "✅ Application updated successfully"

            --first-time)fi

                FIRST_TIME=true

                shiftecho ""

                ;;echo "📞 SUPPORT:"

            --update)echo "──────────"

                UPDATE_MODE=trueecho "📊 Health Check: curl http://103.197.189.168/health"

                shiftecho "🔍 Quick Test: curl -I http://103.197.189.168"

                ;;echo "📝 View Logs: tail -f $LOG_FILE"

            --quick)echo ""

                QUICK_MODE=trueecho "🎊 Happy coding! Your E-EVKIN Modern app is ready!"

                UPDATE_MODE=true
                shift
                ;;
            --seed-only)
                SEED_ONLY=true
                shift
                ;;
            --restart)
                RESTART_ONLY=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    echo -e "${BLUE}"
    echo "E-EVKIN Modern - Ultimate Deployment Script"
    echo "==========================================="
    echo ""
    echo "USAGE:"
    echo "  ./deploy.sh --first-time    Complete initial setup"
    echo "  ./deploy.sh --update        Regular update deployment"  
    echo "  ./deploy.sh --quick         Quick code update only"
    echo "  ./deploy.sh --seed-only     Database seeding only"
    echo "  ./deploy.sh --restart       Restart services only"
    echo "  ./deploy.sh --help          Show this help"
    echo ""
    echo "EXAMPLES:"
    echo "  ./deploy.sh --first-time    # Initial deployment"
    echo "  ./deploy.sh --update        # Regular updates"
    echo "  ./deploy.sh --quick         # Fast updates"
    echo -e "${NC}"
}

main() {
    # Parse command line arguments
    parse_arguments "$@"
    
    # Show help if no arguments
    if [ "$FIRST_TIME" = false ] && [ "$UPDATE_MODE" = false ] && [ "$SEED_ONLY" = false ] && [ "$RESTART_ONLY" = false ]; then
        show_help
        exit 0
    fi
    
    # Check root privileges
    check_root
    
    header "$APP_NAME - ULTIMATE DEPLOYMENT"
    log "Starting deployment with selected options..."
    
    # Create log file
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    
    # Main deployment logic based on flags
    if [ "$SEED_ONLY" = true ]; then
        log "Running database seeding only..."
        seed_database
    elif [ "$RESTART_ONLY" = true ]; then
        log "Running service restart only..."
        restart_services
    elif [ "$FIRST_TIME" = true ]; then
        log "Running first-time setup..."
        install_system_dependencies
        install_nodejs
        setup_database
        setup_environment
        install_dependencies
        build_applications
        seed_database
        configure_nginx
        manage_backend_process
        perform_health_checks
        print_summary
    elif [ "$UPDATE_MODE" = true ]; then
        log "Running update deployment..."
        install_dependencies
        build_applications
        manage_backend_process
        systemctl reload nginx
        perform_health_checks
        success "Update deployment completed!"
    fi
    
    success "Deployment completed successfully!"
}

# Execute main function with all arguments
main "$@"