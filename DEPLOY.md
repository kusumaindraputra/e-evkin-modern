# Deployment Guide (2GB RAM Server)

This guide is optimized for a server with **2 Cores and 2GB RAM**.
> **CRITICAL**: Do NOT run `docker-compose up --build` on the server. The build process will crash your server. Build locally, then push.

## Phase 1: Local Preparation (Your Machine)

1.  **Login to Docker Hub**
    ```powershell
    docker login
    ```

2.  **Build & Tag Images**
    Replace `yourusername` with your Docker Hub username.
    ```powershell
    # Build
    docker build -t yourusername/e-evkin-backend:latest ./backend
    docker build -t yourusername/e-evkin-frontend:latest ./frontend

    # Push
    docker push yourusername/e-evkin-backend:latest
    docker push yourusername/e-evkin-frontend:latest
    ```

3.  **Update `docker-compose.yml`**
    Edit your `docker-compose.yml` to use the remote images instead of building locally.
    
    *Change this:*
    ```yaml
    backend:
      build: ./backend
    ```
    *To this:*
    ```yaml
    backend:
      image: yourusername/e-evkin-backend:latest
    ```
    *(Do the same for frontend)*

## Phase 2: Server Setup (The 2GB Server)

1.  **SSH into Server**
    ```bash
    ssh user@your-server-ip
    ```

2.  **Add Swap Space (CRITICAL)**
    This prevents crashes if RAM creates a spike.
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    ```

3.  **Install Docker**
    ```bash
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    ```

## Phase 3: Deployment

1.  **Copy Configuration**
    You need `docker-compose.yml` on the server. You can copy it via SCP or just create it.
    ```bash
    # On Server
    mkdir e-evkin
    cd e-evkin
    nano docker-compose.yml
    # Paste the content of your modified docker-compose.yml
    ```

2.  **Set Environment Variables**
    Create a `.env` file for your secrets.
    ```bash
    nano .env
    ```
    Content:
    ```env
    DB_USER=postgres
    DB_PASSWORD=secure_password
    DB_NAME=e_evkin
    JWT_SECRET=very_secure_secret_key
    ```
    *Note: Update `docker-compose.yml` to read these if strictly needed, though the current config passes them directly or has defaults.*

3.  **Start Application**
    ```bash
    sudo docker compose up -d
    ```

## Phase 4: Verification

1.  **Check Status**
    ```bash
    sudo docker compose ps
    ```
2.  **View Logs**
    ```bash
    sudo docker compose logs -f
    ```
