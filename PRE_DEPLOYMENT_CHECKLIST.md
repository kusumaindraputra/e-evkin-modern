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

## ✅ Server Checklist

- [ ] **Node.js v18+ terinstall**
- [ ] **PostgreSQL 14+ terinstall dan running**
- [ ] **PM2 terinstall** (`npm install -g pm2`)
- [ ] **Nginx terinstall dan running**
- [ ] **Port 80 dan 443 terbuka** (untuk HTTP/HTTPS)
- [ ] **Port 5000 available** untuk backend
- [ ] **Firewall configured** (allow port 80, 443, 5432)
- [ ] **SSL certificate** (opsional tapi recommended)

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

## ✅ Nginx Checklist

- [ ] **Config file** dibuat di `/etc/nginx/sites-available/`
- [ ] **Symlink** dibuat di `/etc/nginx/sites-enabled/`
- [ ] **Server name** sesuai domain
- [ ] **Root path** ke `frontend/dist` benar
- [ ] **Proxy pass** ke backend (port 5000) configured
- [ ] **Nginx test** berhasil (`sudo nginx -t`)
- [ ] **Nginx restarted** setelah config
- [ ] **Gzip compression** enabled
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

## 🔧 Quick Commands Reference

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs e-evkin-backend

# Restart backend
pm2 restart e-evkin-backend

# Check Nginx status
sudo systemctl status nginx

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check disk space
df -h

# Check PostgreSQL
sudo systemctl status postgresql

# Monitor system resources
htop
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

**Last Updated:** November 6, 2025
**Deployment Version:** v1.0.0
**Environment:** Staging
