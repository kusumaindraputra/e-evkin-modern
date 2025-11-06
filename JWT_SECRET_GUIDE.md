# JWT_SECRET - Complete Guide

## 🔐 Apa itu JWT_SECRET?

JWT_SECRET adalah kunci rahasia yang digunakan untuk:
- **Menandatangani** (sign) JWT tokens
- **Memverifikasi** (verify) JWT tokens
- **Mengamankan** autentikasi pengguna

**⚠️ PENTING:** JWT_SECRET harus:
- Panjang minimal 32 karakter (recommended: 64+ karakter)
- Random dan unpredictable
- Berbeda untuk development, staging, dan production
- **TIDAK BOLEH** di-commit ke Git
- Disimpan dengan aman (password manager, vault, environment variable)

---

## 🚀 Cara Generate JWT_SECRET

### **Method 1: Auto-Generate saat Deploy (Recommended)**

Script `deploy-backend.sh` sudah otomatis generate JWT_SECRET saat membuat `.env` pertama kali:

```bash
cd backend
./deploy-backend.sh
```

Output:
```
🔐 Generating secure JWT_SECRET...
✅ JWT_SECRET generated using Node.js crypto
✅ .env file created

⚠️  IMPORTANT: Update these values in .env file:
   - DB_PASSWORD (currently: password_evkin)
   - CORS_ORIGIN (currently: http://localhost)
   ✅ JWT_SECRET already set to secure random value
```

---

### **Method 2: Menggunakan Helper Script**

```bash
# Jalankan dari root directory
./generate-jwt-secret.sh
```

Output:
```
🔐 JWT Secret Generator
======================

Method 1: Node.js crypto (Recommended)
✅ Generated JWT_SECRET:
8f7a9b2c1d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1g2h3i4

📋 Copy the secret above and paste it into your .env file:
   JWT_SECRET=8f7a9b2c1d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1g2h3i4

Update backend/.env file now? (y/n):
```

---

### **Method 3: Node.js Command**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Output contoh:
```
3a7b9c2d1e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1g2h3i4j5
```

Copy hasil generate dan paste ke `.env`:
```properties
JWT_SECRET=3a7b9c2d1e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1g2h3i4j5
```

---

### **Method 4: OpenSSL**

```bash
openssl rand -hex 64
```

Output contoh:
```
5c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i0j1k2l3m4
```

---

### **Method 5: Python**

```bash
python -c "import secrets; print(secrets.token_hex(64))"
```

Atau Python 2:
```bash
python -c "import os; print(os.urandom(64).encode('hex'))"
```

---

### **Method 6: Online Generator**

**Websites:**
1. https://www.grc.com/passwords.htm
   - Pilih "63 random alpha-numeric characters"
   - Refresh untuk generate baru

2. https://randomkeygen.com/
   - Pilih "CodeIgniter Encryption Keys"

3. https://1password.com/password-generator/
   - Set length: 64
   - Include: letters, numbers

**⚠️ Note:** Lebih aman generate secara lokal

---

## 📝 Cara Update JWT_SECRET

### Manual Edit

```bash
# Edit .env file
nano backend/.env

# Update line JWT_SECRET
JWT_SECRET=your-new-generated-secret-here

# Save and exit
```

### Menggunakan sed (Linux/Mac)

```bash
# Backup dulu
cp backend/.env backend/.env.backup

# Generate new secret
NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Update .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$NEW_SECRET|g" backend/.env

echo "✅ JWT_SECRET updated to: $NEW_SECRET"
```

### PowerShell (Windows)

```powershell
# Generate new secret
$NEW_SECRET = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Read .env
$envContent = Get-Content backend\.env

# Replace JWT_SECRET line
$envContent = $envContent -replace 'JWT_SECRET=.*', "JWT_SECRET=$NEW_SECRET"

# Save back
$envContent | Set-Content backend\.env

Write-Host "✅ JWT_SECRET updated to: $NEW_SECRET"
```

---

## 🔄 Rotasi JWT_SECRET

### Kapan Harus Rotate?

1. **Scheduled rotation** - Setiap 3-6 bulan (best practice)
2. **Security breach** - Jika ada indikasi kompromi
3. **Team member leaves** - Jika ada developer/admin yang keluar
4. **Token leaked** - Jika token ter-expose di public

### Proses Rotasi

```bash
# 1. Generate new secret
NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# 2. Backup old .env
cp backend/.env backend/.env.backup.$(date +%Y%m%d)

# 3. Update JWT_SECRET
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$NEW_SECRET|g" backend/.env

# 4. Restart backend
pm2 restart e-evkin-backend

# 5. All existing tokens will be invalidated
# Users need to login again
```

**⚠️ Impact:**
- Semua user harus login ulang
- Existing tokens menjadi invalid
- Beri notifikasi ke user sebelumnya

---

## 🛡️ Best Practices

### ✅ DO

1. **Use strong secrets**
   ```bash
   # Good (64 hex characters = 256 bits)
   JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
   ```

2. **Different secrets per environment**
   ```
   Development:  secret_dev_xyz123...
   Staging:      secret_stg_abc456...
   Production:   secret_prd_def789...
   ```

3. **Store securely**
   - Environment variables (server)
   - Password manager (backup)
   - Secrets vault (Vault, AWS Secrets Manager)

4. **Add to .gitignore**
   ```bash
   # .gitignore
   .env
   .env.local
   .env.*.local
   ```

5. **Use .env.example as template**
   ```properties
   # .env.example
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

### ❌ DON'T

1. **Jangan gunakan weak secret**
   ```bash
   # Bad - too simple
   JWT_SECRET=secret
   JWT_SECRET=123456
   JWT_SECRET=myappsecret
   ```

2. **Jangan commit .env ke Git**
   ```bash
   # Check before commit
   git status
   
   # If .env is tracked, remove it
   git rm --cached .env
   ```

3. **Jangan hardcode di source code**
   ```javascript
   // Bad
   const jwt = require('jsonwebtoken');
   const token = jwt.sign(payload, 'hardcoded-secret');
   
   // Good
   const token = jwt.sign(payload, process.env.JWT_SECRET);
   ```

4. **Jangan share secret via chat/email**
   - Gunakan secure password sharing tools
   - Atau share via encrypted channel

5. **Jangan log secret di console**
   ```javascript
   // Bad
   console.log('JWT_SECRET:', process.env.JWT_SECRET);
   
   // Good
   console.log('JWT_SECRET: [REDACTED]');
   ```

---

## 🔍 Verification

### Check JWT_SECRET di .env

```bash
# Show JWT_SECRET (be careful!)
grep JWT_SECRET backend/.env

# Show with masking
grep JWT_SECRET backend/.env | sed 's/\(JWT_SECRET=.\{10\}\).*/\1.../'
```

### Test JWT Token Generation

```bash
cd backend

# Test script
node -e "
const jwt = require('jsonwebtoken');
require('dotenv').config();

const payload = { userId: 1, role: 'admin' };
const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

console.log('✅ Token generated successfully');
console.log('Token length:', token.length);
console.log('Token (first 50 chars):', token.substring(0, 50) + '...');

// Verify
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('✅ Token verified successfully');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.log('❌ Token verification failed:', error.message);
}
"
```

Expected output:
```
✅ Token generated successfully
Token length: 187
Token (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQ...
✅ Token verified successfully
Decoded payload: { userId: 1, role: 'admin', iat: 1699200000, exp: 1699804800 }
```

---

## 🐛 Troubleshooting

### Error: "jwt malformed"

**Cause:** JWT_SECRET tidak match saat verify token

**Solution:**
```bash
# Check JWT_SECRET di .env
cat backend/.env | grep JWT_SECRET

# Restart backend after updating
pm2 restart e-evkin-backend
```

### Error: "secretOrPrivateKey must have a value"

**Cause:** JWT_SECRET kosong atau tidak ter-load

**Solution:**
```bash
# Check .env file exists
ls -la backend/.env

# Check JWT_SECRET value
grep JWT_SECRET backend/.env

# Regenerate if needed
./generate-jwt-secret.sh
```

### Error: "invalid signature"

**Cause:** Token di-sign dengan JWT_SECRET berbeda

**Solution:**
1. User perlu login ulang
2. Clear browser cookies
3. Verify JWT_SECRET tidak berubah

---

## 📋 Quick Commands

```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or with helper script
./generate-jwt-secret.sh

# Check current secret (masked)
grep JWT_SECRET backend/.env | sed 's/\(JWT_SECRET=.\{10\}\).*/\1.../'

# Update secret
nano backend/.env

# Restart backend
pm2 restart e-evkin-backend

# Test token generation
cd backend && node -e "require('dotenv').config(); console.log(require('jsonwebtoken').sign({test:1}, process.env.JWT_SECRET))"
```

---

## 🔗 Related

- **deploy-backend.sh** - Auto-generates JWT_SECRET
- **generate-jwt-secret.sh** - Manual JWT_SECRET generator
- **.env.example** - Template file
- **DEPLOYMENT_SEPARATE.md** - Deployment guide

---

**Status**: ✅ JWT_SECRET auto-generation enabled in deploy script!
