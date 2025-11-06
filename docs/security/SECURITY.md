# Security Implementation

## Data Isolation - Laporan Puskesmas

### Backend Security (laporan.routes.ts)
Semua endpoint laporan sudah diamankan dengan middleware `authenticate` dan data isolation:

#### 1. **GET /api/laporan** - List Laporan
- ✅ Requires authentication
- ✅ Puskesmas: Otomatis filter `user_id` dari token (hanya lihat laporan sendiri)
- ✅ Admin: Bisa filter by `user_id` query parameter

#### 2. **GET /api/laporan/:id** - Detail Laporan
- ✅ Requires authentication
- ✅ Puskesmas: Hanya bisa akses laporan dengan `user_id` yang sama dengan token
- ✅ Admin: Bisa akses semua laporan
- ✅ Response 403 Forbidden jika puskesmas mencoba akses laporan puskesmas lain

#### 3. **POST /api/laporan** - Create Laporan
- ✅ Requires authentication
- ✅ Puskesmas: `user_id` diambil otomatis dari token (tidak bisa create untuk puskesmas lain)
- ✅ Admin: Bisa specify `user_id`

#### 4. **PUT /api/laporan/:id** - Update Laporan
- ✅ Requires authentication
- ✅ Puskesmas: Hanya bisa update laporan dengan `user_id` yang sama dengan token
- ✅ Admin: Bisa update semua laporan
- ✅ Response 403 Forbidden jika puskesmas mencoba update laporan puskesmas lain

#### 5. **DELETE /api/laporan/:id** - Delete Laporan
- ✅ Requires authentication
- ✅ Puskesmas: Hanya bisa delete laporan dengan `user_id` yang sama dengan token
- ✅ Admin: Bisa delete semua laporan
- ✅ Response 403 Forbidden jika puskesmas mencoba delete laporan puskesmas lain

#### 6. **POST /api/laporan/submit** - Submit Laporan
- ✅ Requires authentication
- ✅ Puskesmas: `user_id` diambil otomatis dari token (tidak bisa submit untuk puskesmas lain)
- ✅ Admin: Bisa specify `user_id`

### Frontend Security

#### LaporanPage.tsx
- ✅ Tidak mengirim `user_id` dalam request body (diambil dari token di backend)
- ✅ Route guard: `PuskesmasRoute` mencegah admin akses halaman ini
- ✅ Menu conditional: Hanya tampil untuk role='puskesmas'

### Authentication Flow
1. User login → Receive JWT token containing `{userId, username, role}`
2. Token disimpan di localStorage
3. Setiap request ke backend include header: `Authorization: Bearer <token>`
4. Backend middleware `authenticate` verify token dan extract user info
5. Backend routes check `req.user.role` dan filter data sesuai role

### Type Safety
- ✅ TypeScript type definition untuk `req.user` di `backend/src/types/express.d.ts`
- ✅ Interface: `{ userId: number, username: string, role: string }`

## Security Checklist
- [x] All laporan endpoints require authentication
- [x] Puskesmas can only see their own data
- [x] Puskesmas cannot modify other puskesmas' data
- [x] Admin can see and modify all data
- [x] Frontend doesn't send user_id (taken from token)
- [x] Route guards prevent cross-role access
- [x] TypeScript types ensure type safety
- [x] JWT token verification on every request
