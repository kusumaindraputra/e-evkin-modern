# E-EVKIN Modern - Manual Deployment

## Step 1: Upload Files to Server

Upload this entire `deploy-package` folder to your server at `/tmp/deploy-package`

### Option A: Using aaPanel File Manager
1. Login to aaPanel
2. Go to Files
3. Navigate to `/tmp/`
4. Upload the `deploy-package` folder

### Option B: Using SFTP
```bash
# If you can setup SFTP access
sftp kusuma@103.197.189.168
put -r deploy-package /tmp/
```

### Option C: Using scp (if SSH key works)
```bash
scp -r deploy-package kusuma@103.197.189.168:/tmp/
```

## Step 2: SSH to Server and Install

```bash
ssh kusuma@103.197.189.168
cd /tmp
sudo bash deploy-package/install.sh
```

## Step 3: Seed Database

```bash
cd /www/wwwroot/e-evkin-modern/backend
sudo -u www-data node src/seeders/seedReference.js
sudo -u www-data node src/seeders/seed2025.js
```

## Step 4: Verify Installation

- Frontend: http://103.197.189.168
- Backend API: http://103.197.189.168/api
- Login: admin@eevkin.com / admin123

## Troubleshooting

Check services:
```bash
pm2 status
systemctl status nginx
systemctl status postgresql
```

Check logs:
```bash
pm2 logs eevkin-backend
tail -f /var/log/nginx/error.log
```
