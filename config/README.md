# ⚙️ E-EVKIN Modern - Configuration Directory

Configuration files for deployment and server setup.

## 📁 Configuration Files

### **`ecosystem.config.js`** - PM2 Process Manager Configuration
- **Purpose**: PM2 configuration for Node.js backend process
- **Optimized for**: 2GB RAM server (Ubuntu + aaPanel)
- **Mode**: Fork mode (single instance)
- **Memory limit**: 800MB with auto-restart
- **Logging**: Configured with log rotation

**Usage:**
```bash
# Start application
pm2 start config/ecosystem.config.js

# Restart application  
pm2 restart e-evkin-backend

# View logs
pm2 logs e-evkin-backend
```

### **`nginx.conf`** - Nginx Web Server Configuration
- **Purpose**: Nginx reverse proxy and static file serving
- **Optimized for**: 2GB RAM server
- **Path structure**: aaPanel compatible (`/www/wwwroot/`)
- **Features**: Gzip compression, caching, security headers
- **Proxy**: Backend API proxy to localhost:5000

**Usage:**
```bash
# Copy to nginx sites-available
sudo cp config/nginx.conf /etc/nginx/sites-available/e-evkin

# Enable site
sudo ln -s /etc/nginx/sites-available/e-evkin /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## 🔧 Configuration Details

### PM2 Configuration (`ecosystem.config.js`)
```javascript
{
  name: 'e-evkin-backend',
  instances: 1,                    // Single instance for 2GB RAM
  exec_mode: 'fork',              // More efficient than cluster
  max_memory_restart: '800M',     // Safe for 2GB server
  script: 'dist/server.js',       // Compiled TypeScript
  env: {
    NODE_ENV: 'production',
    PORT: 5000
  }
}
```

### Nginx Configuration (`nginx.conf`)
```nginx
server {
  listen 80;
  root /www/wwwroot/e-evkin-modern/frontend/dist;  # aaPanel path
  
  # Frontend SPA
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  # Backend API  
  location /api {
    proxy_pass http://127.0.0.1:5000;
  }
}
```

## 🚀 Deployment Integration

These configurations are used by:
- **`../deploy.sh`** - Main deployment script
- **`../scripts/optimize-server.sh`** - Server optimization
- **PM2 startup** - Process management
- **Nginx/aaPanel** - Web server setup

## 📋 Environment-Specific Settings

### **Development:**
- Use local paths
- Enable debugging
- Hot reload

### **Staging:**
- Use `/www/wwwroot/` paths
- Moderate caching
- Performance monitoring

### **Production:**
- Enhanced security headers
- Aggressive caching
- SSL termination
- Load balancing (if needed)

## 🔄 Customization

### **Domain Configuration:**
Edit `nginx.conf`:
```nginx
server_name your-actual-domain.com;
```

### **Memory Limits:**
Edit `ecosystem.config.js`:
```javascript
max_memory_restart: '1200M'  // Adjust based on server RAM
```

### **Backend Port:**
Edit both files if changing from port 5000:
- `ecosystem.config.js`: `PORT: 5001`
- `nginx.conf`: `proxy_pass http://127.0.0.1:5001`

## ⚠️ Important Notes

1. **Path Compatibility**: Configurations use aaPanel paths (`/www/wwwroot/`)
2. **Memory Optimization**: Settings optimized for 2GB RAM servers
3. **Security**: Basic security headers configured
4. **Monitoring**: PM2 logging and process monitoring enabled

## 📚 Related Documentation

- **Server Setup**: `../docs/deployment/DEPLOYMENT_UBUNTU_AAPANEL.md`
- **Deployment Guide**: `../docs/deployment/DEPLOYMENT.md`
- **Server Optimization**: `../scripts/optimize-server.sh`

---

**Location**: `/config/`  
**Files**: 2 configuration files  
**Platform**: Ubuntu 24 + aaPanel + 2GB RAM  
**Updated**: November 6, 2025