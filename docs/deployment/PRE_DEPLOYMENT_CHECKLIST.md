# E-EVKIN Modern - Pre-Deployment Checklist

## ✅ Backend Checklist

- [ ] **Build berhasil** (`npm run build` di folder backend)
- [ ] **Environment variables sudah dikonfigurasi**
  - [ ] `.env.staging` atau `.env.production` sudah dibuat
  - [ ] `DB_HOST`, `DB_PORT`, `DB_NAME` sesuai server
  - [ ] `DB_USER`, `DB_PASSWORD` sudah aman
  - [ ] `JWT_SECRET` diganti dengan string random yang aman (minimal 32 karakter)
  - [ ] `CORS_ORIGIN` sesuai dengan URL frontend
  - [ ] `PORT` sesuai (default: 5000)
- [ ] **Dependencies sudah lengkap** (check `package.json`)
- [ ] **Database sudah dibuat** di PostgreSQL
- [ ] **Test connection ke database** berhasil
- [ ] **Tidak ada error di logs**

## ✅ Frontend Checklist

- [ ] **Build berhasil** (`npm run build` di folder frontend)
- [ ] **API URL sudah sesuai**
  - Check semua endpoint axios masih menggunakan `http://localhost:5000`
  - Perlu diganti dengan URL backend production
- [ ] **File `dist/` sudah ter-generate**
- [ ] **Test load `dist/index.html`** di browser
- [ ] **Tidak ada console errors**

## ✅ Server Checklist (aaPanel)

- [ ] **Node.js v18+ terinstall** (via aaPanel Package Manager)
- [ ] **PostgreSQL 14+ terinstall** (via aaPanel Package Manager)
- [ ] **PM2 terinstall** (`npm install -g pm2`)
- [ ] **aaPanel interface** accessible dan configured
- [ ] **Firewall configured** via aaPanel (allow port 80, 443, 8888)
- [ ] **SSL certificate** managed via aaPanel (Let's Encrypt)

## ✅ Database Checklist

- [ ] **Database dibuat** dengan nama yang sesuai
- [ ] **User database dibuat** dengan password yang aman
- [ ] **Privileges diberikan** ke user
- [ ] **PostgreSQL accepting connections** dari backend
- [ ] **Backup mechanism** sudah ada (cron job)

## ✅ Security Checklist

- [ ] **JWT_SECRET** bukan default, minimal 32 karakter random
- [ ] **Database password** aman dan kompleks
- [ ] **Default user passwords** sudah diganti
- [ ] **CORS** hanya allow domain yang benar
- [ ] **Rate limiting** aktif (sudah ada di kode)
- [ ] **HTTPS** digunakan (via Nginx + Let's Encrypt)
- [ ] **Environment variables** tidak di-commit ke Git

## ✅ PM2 Checklist

- [ ] **PM2 configured** dengan `ecosystem.config.js`
- [ ] **PM2 startup** di-enable untuk auto-restart
- [ ] **PM2 logs** directory ada (`backend/logs/`)
- [ ] **Max memory restart** configured (500MB default)
- [ ] **PM2 monit** bisa diakses untuk monitoring

## ✅ Nginx Checklist (aaPanel)

- [ ] **Site created** di aaPanel Web interface
- [ ] **Domain** sudah ditambahkan dan pointing ke server
- [ ] **Root path** diset ke `/www/wwwroot/[domain]/frontend/dist/`
- [ ] **Backend uploaded** ke `/www/wwwroot/[domain]/backend/`
- [ ] **Reverse proxy** configured untuk API (`location /api`)
- [ ] **Static files** configured dengan proper cache headers
- [ ] **Nginx config** updated via aaPanel interface
- [ ] **SSL certificate** installed (Let's Encrypt via aaPanel)
- [ ] **Gzip compression** enabled via aaPanel
- [ ] **Security headers** ditambahkan

## ✅ Post-Deployment Testing

- [ ] **Frontend accessible** via domain
- [ ] **Login page** muncul dengan benar
- [ ] **API calls** berhasil (cek Network tab)
- [ ] **Login** dengan admin berhasil
- [ ] **Dashboard** muncul dengan data
- [ ] **CRUD operations** berfungsi (test create/edit/delete)
- [ ] **File upload** berfungsi (jika ada)
- [ ] **Logout** berfungsi
- [ ] **Session persistence** bekerja (refresh page tetap login)
- [ ] **No console errors**
- [ ] **No 404 errors** di Network tab
- [ ] **Backend logs** tidak ada error

## ✅ Monitoring Setup

- [ ] **PM2 monitoring** aktif (`pm2 monit`)
- [ ] **Log rotation** configured
- [ ] **Disk space monitoring** (minimal 20% free)
- [ ] **Uptime monitoring** (optional: UptimeRobot, etc)
- [ ] **Error alerting** configured (email/Slack)

## ✅ Documentation

- [ ] **Credentials** dicatat dengan aman
- [ ] **Deployment date** dicatat
- [ ] **Version/commit hash** dicatat
- [ ] **Contact person** untuk support
- [ ] **Rollback procedure** documented

## 🔧 Quick Commands Reference (aaPanel Environment)

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs e-evkin-backend

# Restart backend
pm2 restart e-evkin-backend

# Check Nginx status (via aaPanel or terminal)
sudo systemctl status nginx

# Check disk space
df -h

# Check PostgreSQL (via aaPanel Database Manager)
sudo systemctl status postgresql

# Monitor system resources
htop

# aaPanel specific paths
ls -la /www/wwwroot/       # Website files
ls -la /www/backup/        # Backups
ls -la /www/server/        # Server software

# View aaPanel logs
tail -f /www/server/panel/logs/error.log
```

## 🆘 Emergency Contacts

- **Developer:** [Name] - [Email/Phone]
- **DevOps:** [Name] - [Email/Phone]
- **Database Admin:** [Name] - [Email/Phone]

## 📝 Notes

- Dokumentasikan setiap issue yang ditemukan
- Catat semua password dan credentials dengan aman
- Lakukan backup database sebelum deployment
- Test di staging sebelum production
- Siapkan rollback plan

---

**Last Updated:** January 2025
**Target Environment:** Ubuntu 24.04 + aaPanel + 2GB RAM
**Deployment Version:** v1.0.0
