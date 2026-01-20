# Deployment Guide (2GB RAM Server with External Database)

This guide is optimized for a server with **2 Cores and 2GB RAM** using an **external PostgreSQL database**.

> **NOTE**: Database runs on a separate server. Only backend and frontend containers are deployed.

## Prerequisites

- Docker & Docker Compose installed on deployment server
- External PostgreSQL database accessible from deployment server
- Docker Hub account (for pushing images)

## Phase 1: Local Preparation (Your Machine)

### 1. Login to Docker Hub
```powershell
docker login
```

### 2. Build & Push Images
Replace `yourusername` with your Docker Hub username.
```powershell
# Build
docker build -t yourusername/e-evkin-backend:latest ./backend
docker build -t yourusername/e-evkin-frontend:latest ./frontend

# Push
docker push yourusername/e-evkin-backend:latest
docker push yourusername/e-evkin-frontend:latest
```

### 3. Create Production docker-compose.yml
Create `docker-compose.prod.yml` for deployment:
```yaml
services:
  backend:
    image: yourusername/e-evkin-backend:latest
    container_name: e-evkin-backend
    environment:
      NODE_ENV: production
      PORT: 5000
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT:-5432}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN}
    ports:
      - "5000:5000"
    restart: always

  frontend:
    image: yourusername/e-evkin-frontend:latest
    container_name: e-evkin-frontend
    ports:
      - "8080:80"
    depends_on:
      - backend
    restart: always
```

## Phase 2: Server Setup

### 1. SSH into Server
```bash
ssh user@your-server-ip
```

### 2. Add Swap Space (Recommended for 2GB RAM)
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 3. Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

## Phase 3: Deployment

### 1. Create Project Directory
```bash
mkdir -p ~/e-evkin
cd ~/e-evkin
```

### 2. Create Environment File
```bash
nano .env
```
Content:
```env
# Database (External Server)
DB_HOST=your-database-server-ip
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=e_evkin

# Application
JWT_SECRET=your_very_secure_jwt_secret_min_32_chars
CORS_ORIGIN=https://your-domain.com
```

### 3. Create docker-compose.yml
```bash
nano docker-compose.yml
```
Paste the production docker-compose content from Phase 1.

### 4. Start Application
```bash
sudo docker compose up -d
```

## Phase 4: Database Setup (On Database Server)

### 1. Create Database
```sql
CREATE DATABASE e_evkin;
```

### 2. Allow Remote Connections
Edit `postgresql.conf`:
```
listen_addresses = '*'
```

Edit `pg_hba.conf` to allow your app server:
```
host    e_evkin    postgres    your-app-server-ip/32    md5
```

### 3. Restart PostgreSQL
```bash
sudo systemctl restart postgresql
```

## Phase 5: Verification

### 1. Check Container Status
```bash
sudo docker compose ps
```

### 2. View Logs
```bash
sudo docker compose logs -f backend
```

### 3. Test Database Connection
```bash
sudo docker compose exec backend node -e "
const { Sequelize } = require('sequelize');
const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres'
});
seq.authenticate().then(() => console.log('DB Connected!')).catch(e => console.error('DB Error:', e));
"
```

## Updating Application

```bash
cd ~/e-evkin
sudo docker compose pull
sudo docker compose up -d
```

## Troubleshooting

### Backend can't connect to database
1. Check if database server allows remote connections
2. Verify firewall rules (port 5432)
3. Check `.env` credentials
4. Test connection: `psql -h DB_HOST -U DB_USER -d DB_NAME`

### Container keeps restarting
```bash
sudo docker compose logs backend --tail 100
```
