# Quick Start Guide

## Prerequisites Check

✅ Node.js 18+ installed (recommend upgrading to 20+)
✅ npm installed
✅ PostgreSQL 16 installed
✅ Dependencies installed (943 packages backend + 946 packages frontend)

## Setup Steps

### 1. Configure Environment

```bash
cd d:\proj\e-evkin-modern\backend
copy .env.example .env
notepad .env
```

Update these values in `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=evkin_db
DB_USER=postgres
DB_PASSWORD=YOUR_ACTUAL_PASSWORD

JWT_SECRET=YOUR_SECRET_KEY_HERE
```

### 2. Create PostgreSQL Database

```bash
# Option A: Using psql command line
psql -U postgres
CREATE DATABASE evkin_db;
\q

# Option B: Using pgAdmin GUI
# 1. Open pgAdmin
# 2. Right-click "Databases"
# 3. Create -> Database
# 4. Name: evkin_db
# 5. Save
```

### 3. Start Development Servers

```bash
# From project root
cd d:\proj\e-evkin-modern
npm run dev
```

This will start:
- Backend API: http://localhost:5000
- Frontend App: http://localhost:5173

### 4. Access the Application

Open browser: http://localhost:5173

**Test Credentials** (after seeding database):
- Username: `admin`
- Password: (set during migration)

## What Works Now

✅ Project structure created
✅ All dependencies installed
✅ TypeScript configuration
✅ Frontend routing (Login, Dashboard, Laporan pages)
✅ Backend API structure
✅ Database models defined
✅ Security middleware configured

## What Needs Implementation

⏳ **Critical (Required to Run)**:
1. ❌ Database seeding (create initial admin user)
2. ❌ Authentication controller (login/logout logic)
3. ❌ API service integration (connect frontend to backend)

⏳ **High Priority**:
4. ❌ JWT authentication middleware
5. ❌ Laporan CRUD controllers
6. ❌ Data migration from MySQL

⏳ **Medium Priority**:
7. ❌ Dashboard statistics API
8. ❌ Excel export functionality
9. ❌ Admin management features

## Common Issues & Solutions

### Issue: "Cannot connect to database"
**Solution**: 
1. Check PostgreSQL is running: `psql -U postgres -c "SELECT version();"`
2. Verify credentials in `.env`
3. Ensure database `evkin_db` exists

### Issue: "Port 5000 already in use"
**Solution**: 
Change `PORT=5000` to `PORT=5001` in `.env`

### Issue: "TypeScript errors"
**Solution**: 
Most errors are warnings about incomplete implementations - safe to ignore during development

### Issue: "Node engine warning"
**Solution**: 
Upgrade to Node.js 20 LTS from https://nodejs.org/

## Next Steps for Development

### Step 1: Create Admin User Manually

```bash
# Connect to database
psql -U postgres -d evkin_db

# Create admin user
INSERT INTO users (id, username, password, nama, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin',
  '$2b$10$...',  -- Use bcrypt to hash password
  'Administrator',
  'admin',
  NOW(),
  NOW()
);
```

### Step 2: Implement Login Controller

Create `backend/src/controllers/auth.controller.ts`:
```typescript
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { config } from '../config';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  const user = await User.findOne({ where: { username } });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ id: user.id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
  
  res.json({ user, token });
};
```

### Step 3: Connect Frontend to Backend

Create `frontend/src/services/api.ts`:
```typescript
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

## Development Workflow

1. **Backend Development**:
   ```bash
   cd backend
   npm run dev  # TypeScript hot reload with tsx
   ```

2. **Frontend Development**:
   ```bash
   cd frontend
   npm run dev  # Vite hot reload
   ```

3. **Run Tests**:
   ```bash
   npm run test
   ```

4. **Lint Code**:
   ```bash
   npm run lint
   ```

5. **Format Code**:
   ```bash
   npm run format
   ```

## Project Status

**Overall Progress**: 60% Complete

- ✅ Project scaffolding: 100%
- ✅ Dependencies: 100%
- ✅ Configuration: 100%
- ⚠️ Backend implementation: 40%
- ⚠️ Frontend implementation: 50%
- ❌ Testing: 0%
- ❌ Data migration: 0%

---

**Ready to code!** 🚀

Follow the Next Steps section above to continue development.
