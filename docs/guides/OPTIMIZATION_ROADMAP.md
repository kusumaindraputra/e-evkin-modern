# E-EVKIN Modern - Performance Optimization Roadmap

## 📊 Overview

Berikut adalah roadmap lengkap untuk optimasi aplikasi E-EVKIN Modern, covering both backend dan frontend. Semua issues sudah di-track di Beads untuk memudahkan monitoring.

---

## 🎯 Priority Breakdown

### 🔴 P0 - Critical Baseline (Immediate)

#### `e-evkin-modern-54r` - Benchmark & Document Current Performance Baseline

**Purpose**: Establish current performance metrics sebagai baseline untuk mengukur improvement dari optimasi-optimasi yang akan dilakukan.

**What to do**:
```bash
# 1. Measure Frontend Bundle Size
cd frontend && npm run build
# Note the bundle.js size from dist/

# 2. Measure API Response Times
# Test with: /laporan?tahun=2025&bulan=1
# Expected: <1000ms

# 3. Measure Dashboard Load Time
# Time from page load to "Chart Rendered"

# 4. Measure Bulk Save Performance
# Test with 50+ rows
# Expected: <1 second

# 5. Database Connection Pool Usage
psql e_evkin -c "SELECT count(*) FROM pg_stat_activity WHERE datname='e_evkin';"
```

**Expected Metrics**:
- Frontend bundle size: ~1.65 MB (gzipped)
- API response time: 300-800ms for laporan list
- Dashboard load: 0.5-1.5s
- Bulk save: 0.5-1s
- Peak connections: 3-5 active

**Document**: Create `docs/PERFORMANCE_BASELINE.md` dengan format:
```markdown
## Current Performance (Date: YYYY-MM-DD)

### Frontend
- Bundle size: X KB (gzipped)
- LCP (Largest Contentful Paint): Xms
- FCP (First Contentful Paint): Xms

### Backend API
- Laporan list (/laporan?tahun=2025): Xms
- Dashboard data (/report/dashboard): Xms
- Bulk save (/laporan/bulk-upsert): Xms (50 rows)

### Database
- Max connections in pool: X
- Avg query time: Xms
- Slow queries (>1s): X queries
```

**Beads Issue**: [P0] Benchmark & Document Current Performance Baseline

---

### 🟡 P1 - High Impact (This Week)

#### `e-evkin-modern-82f` / `e-evkin-modern-vz6` - Add React.memo + useCallback untuk LaporanBulkInputPage

**Problem**:
- LaporanBulkInputPage has 100+ input cells
- Every state change triggers full component re-render
- All cells re-render even if only one value changed
- Current re-renders: 10-15 per interaction

**Solution**:
```typescript
// 1. Create memoized cell component
const LaporanInputCell = React.memo(({ 
  value, 
  onChange, 
  disabled 
}: Props) => (
  <InputNumber 
    value={value}
    onChange={onChange}
    disabled={disabled}
  />
), (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return prevProps.value === nextProps.value &&
         prevProps.disabled === nextProps.disabled;
});

// 2. Use useCallback for handlers
const handleCellChange = useCallback((rowId: number, field: string, value: any) => {
  setRows(prev => prev.map(row => 
    row.id === rowId ? { ...row, [field]: value } : row
  ));
}, []);

// 3. Pass only necessary props to children
<LaporanInputCell
  key={`${row.id}-${col.key}`}
  value={row[col.key]}
  onChange={(val) => handleCellChange(row.id, col.key, val)}
/>
```

**Expected Impact**:
- Re-renders per interaction: 10-15 → 2-3 (80-85% reduction)
- Cell edit response time: 50ms → 10ms
- Overall page responsiveness: ~5x better

**Implementation Steps**:
1. [ ] Identify all cells in LaporanBulkInputPage
2. [ ] Extract to memoized component
3. [ ] Add useCallback to row update handlers
4. [ ] Test with React DevTools Profiler
5. [ ] Measure render count improvement

**Files to modify**:
- `frontend/src/pages/LaporanBulkInputPage.tsx`
- `frontend/src/components/LaporanInputCell.tsx` (create or update)

**Beads Issue**: [P1] Add React.memo + useCallback untuk LaporanBulkInputPage

---

#### `e-evkin-modern-6rz` - Implement Code Splitting untuk Admin Pages

**Problem**:
- All admin pages bundled together
- Users don't need all pages loaded at once
- Current bundle: 1.65 MB (full app)
- Admin section: ~30% of bundle

**Solution**:
```typescript
// frontend/src/pages/index.ts - Current (bad)
import AdminMasterDataPage from './AdminMasterDataPage';
import AdminAngkasUploadPage from './AdminAngkasUploadPage';
// ...all pages loaded

// frontend/src/pages/index.ts - Optimized (good)
export const AdminMasterDataPage = lazy(() => import('./AdminMasterDataPage'));
export const AdminAngkasUploadPage = lazy(() => import('./AdminAngkasUploadPage'));
// ... other admin pages as lazy

// App.tsx - Wrap lazy components with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <AdminMasterDataPage />
</Suspense>
```

**Expected Impact**:
- Initial bundle: 1.65 MB → 1.1-1.2 MB (27% reduction)
- Initial page load: 50ms faster
- First interaction: visible sooner
- Admin pages: loaded on-demand (when user navigates there)

**Implementation Steps**:
1. [ ] Identify admin-only pages
2. [ ] Convert imports to lazy() + React.lazy
3. [ ] Wrap in Suspense with loading UI
4. [ ] Test with bundlesize analyzer
5. [ ] Measure initial bundle reduction

**Files to modify**:
- `frontend/src/App.tsx`
- `frontend/src/pages/` (multiple files)

**Commands**:
```bash
# Measure current bundle
cd frontend && npm run build
# Check dist/ folder size

# Install bundlesize analyzer (optional)
npm install --save-dev @bundle-analyzer/webpack-bundle-analyzer
```

**Beads Issue**: [P1] Implement Code Splitting untuk Admin Pages

---

### 🟡 P2 - Medium Impact (Next Week)

#### `e-evkin-modern-way` - Add Redis Caching untuk Reference Data

**Problem**:
- Reference data (sumber anggaran, satuan, kegiatan) rarely changes
- Every API call fetches from database (~50-100ms)
- Same data requested by 102 puskesmas every session
- Database queries: 300+ per day for same static data

**Solution**:
```typescript
// backend/src/config/redis.ts (create)
import redis from 'redis';

export const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// backend/src/routes/reference.routes.ts (update)
router.get('/sumber-anggaran', async (req, res) => {
  try {
    // 1. Check cache
    const cached = await redisClient.get('sumber-anggaran');
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // 2. If not in cache, fetch from DB
    const data = await SumberAnggaran.findAll();

    // 3. Store in cache (5-minute TTL)
    await redisClient.setex('sumber-anggaran', 300, JSON.stringify(data));

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// When admin creates new sumber anggaran, invalidate cache:
router.post('/sumber-anggaran', authenticate, authorizeAdmin, async (req, res) => {
  // ... create logic
  
  // Invalidate cache
  await redisClient.del('sumber-anggaran');
  
  res.json(result);
});
```

**Expected Impact**:
- Reference data query: 50-100ms → <5ms (cache hit)
- Database load: 300 queries/day → ~10 queries/day
- API response time for reference endpoints: 90% faster
- Total throughput: 20-30% improvement

**Implementation Steps**:
1. [ ] Install redis package: `npm install redis`
2. [ ] Create redis config
3. [ ] Update reference.routes.ts to use cache
4. [ ] Add cache invalidation on POST/PUT/DELETE
5. [ ] Monitor hit ratio in production

**Environment Variables**:
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=300  # 5 minutes
```

**Beads Issue**: [P2] Add Redis Caching untuk Reference Data

---

#### `e-evkin-modern-ijo` - Implement Virtual Scrolling untuk Large Tables

**Problem**:
- Admin Laporan list can have 1000+ rows
- All rows rendered at once = DOM nodes × 1000 = slow
- Scrolling laggy when users navigate table
- Memory usage: 100MB+ for large datasets

**Solution**:
```typescript
// Install react-window
npm install react-window

// frontend/src/pages/AdminLaporanSubKegiatanPage.tsx (update)
import { FixedSizeList } from 'react-window';

export const AdminLaporanSubKegiatanPage: React.FC = () => {
  const [data, setData] = useState<Laporan[]>([]);

  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style} className="table-row">
      {/* Render only visible rows */}
      <span>{data[index].kode_sub}</span>
      <span>{data[index].bulan}</span>
      {/* ... other columns */}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={data.length}
      itemSize={35}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

**Expected Impact**:
- DOM nodes: 1000+ → ~30 visible
- Scroll performance: smooth (60 FPS)
- Memory usage: 100MB+ → 10-20MB
- Initial render: 50ms → <10ms

**Implementation Steps**:
1. [ ] Identify tables with >100 rows
2. [ ] Replace Ant Design Table with react-window List
3. [ ] Implement custom Row component
4. [ ] Test scroll performance
5. [ ] Measure FPS improvement

**Affected Pages**:
- AdminLaporanSubKegiatanPage
- AdminLaporanSumberAnggaranPage
- (any admin pages with large lists)

**Beads Issue**: [P2] Implement Virtual Scrolling untuk Large Tables

---

#### `e-evkin-modern-goh` - Optimize Laporan Dashboard Queries dengan Materialized Views

**Problem**:
- Dashboard aggregates 61,200 laporan records daily
- Current query: `SUM(realisasi_k), SUM(realisasi_rp)` by month
- Query time: 800-1200ms for large dataset
- Complex joins with SubKegiatan, SumberAnggaran, Satuan

**Solution**:
```sql
-- Create materialized view in PostgreSQL
CREATE MATERIALIZED VIEW laporan_dashboard_summary AS
SELECT 
  tahun,
  bulan,
  SUM(target_k) as total_target_k,
  SUM(target_rp) as total_target_rp,
  SUM(realisasi_k) as total_realisasi_k,
  SUM(realisasi_rp) as total_realisasi_rp,
  COUNT(*) as jumlah_laporan
FROM laporan
WHERE status = 'verified' OR status = 'draft'
GROUP BY tahun, bulan;

-- Create index for faster queries
CREATE INDEX idx_dashboard_summary ON laporan_dashboard_summary(tahun, bulan);

-- Refresh view daily (via cron)
REFRESH MATERIALIZED VIEW CONCURRENTLY laporan_dashboard_summary;
```

**TypeScript Implementation**:
```typescript
// backend/src/routes/report.routes.ts (update)
router.get('/dashboard', authenticate, authorizeAdmin, async (req, res) => {
  try {
    // Query materialized view instead of raw table
    const [results] = await sequelize.query(`
      SELECT * FROM laporan_dashboard_summary
      WHERE tahun = :tahun
      ORDER BY bulan
    `, {
      replacements: { tahun: new Date().getFullYear() }
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});
```

**Expected Impact**:
- Query time: 800-1200ms → 50-100ms (90% faster)
- Dashboard load: 1.5-2s → 0.5-0.7s
- Database CPU: 20% → 2%
- Can handle 10x more concurrent users

**Implementation Steps**:
1. [ ] Create materialized view (SQL migration)
2. [ ] Create refresh function
3. [ ] Update dashboard API to use view
4. [ ] Set up daily refresh (cron job)
5. [ ] Monitor query performance

**Beads Issue**: [P2] Optimize Laporan Dashboard Queries dengan Materialized Views

---

### 🟠 P3 - Low Priority (Future)

#### `e-evkin-modern-wsy` - Add TypeScript Strict Mode untuk Better Tree Shaking

**Purpose**: Enable TypeScript strict mode untuk better tree-shaking dan smaller bundle.

**Changes**:
```json
// tsconfig.json - Update
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

**Expected Impact**:
- Bundle size: 1-2% reduction
- Type safety: 100% (catch more errors at compile time)
- Build time: ~5% slower (more type checking)

**Beads Issue**: [P3] Add TypeScript Strict Mode untuk Better Tree Shaking

---

#### `e-evkin-modern-1b7` - Audit & Remove Unused Dependencies

**Purpose**: Identify and remove unused packages untuk reduce bundle size dan simplify maintenance.

**How to audit**:
```bash
# Frontend
cd frontend
npm ls  # List all dependencies
npx depcheck  # Find unused packages

# Backend
cd ../backend
npx depcheck
```

**Expected Impact**:
- Remove 1-3 unused packages
- Bundle size: 1-5% reduction
- Cleaner dependencies

**Beads Issue**: [P3] Audit & Remove Unused Dependencies di Backend dan Frontend

---

## 📈 Expected Overall Performance Improvement

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Frontend Bundle** | 1.65 MB | 1.1 MB | 33% ↓ |
| **Initial Load** | ~2s | ~1s | 50% ↓ |
| **LaporanBulkInputPage renders** | 10-15 per input | 2-3 per input | 80% ↓ |
| **Dashboard query** | 800-1200ms | 50-100ms | 90% ↓ |
| **Reference data endpoint** | 50-100ms | <5ms (cached) | 95% ↓ |
| **Large table scrolling** | Laggy (10 FPS) | Smooth (60 FPS) | ✅ |

---

## 🚀 Implementation Timeline

### Week 1 (Jan 4-10)
- [ ] P0: Benchmark & Document Baseline
- [ ] P1: React.memo for LaporanBulkInputPage
- [ ] Start P1: Code Splitting

### Week 2 (Jan 11-17)
- [ ] Finish P1: Code Splitting
- [ ] P2: Redis Caching setup
- [ ] P2: Virtual Scrolling POC

### Week 3+ (Jan 18+)
- [ ] P2: Materialized Views
- [ ] P3: TypeScript Strict Mode
- [ ] P3: Dependency Audit
- [ ] Performance regression testing

---

## 📊 Success Criteria

- [ ] All P0 issues completed with documented baseline
- [ ] At least 2/2 P1 issues completed (React.memo + Code Splitting)
- [ ] 1+ P2 issues completed (Redis or Materialized Views)
- [ ] Overall bundle size reduction: >20%
- [ ] Dashboard load time: <1 second
- [ ] Bulk input responsiveness: <50ms per cell edit

---

## 🔗 Related Issues in Beads

```
e-evkin-modern-54r [P0] - Benchmark & Document Current Performance Baseline
e-evkin-modern-82f [P1] - Add React.memo + useCallback untuk LaporanBulkInputPage
e-evkin-modern-6rz [P1] - Implement Code Splitting untuk Admin Pages
e-evkin-modern-way [P2] - Add Redis Caching untuk Reference Data
e-evkin-modern-ijo [P2] - Implement Virtual Scrolling untuk Large Tables
e-evkin-modern-goh [P2] - Optimize Laporan Dashboard Queries dengan Materialized Views
e-evkin-modern-wsy [P3] - Add TypeScript Strict Mode untuk Better Tree Shaking
e-evkin-modern-1b7 [P3] - Audit & Remove Unused Dependencies di Backend dan Frontend
```

---

**Last Updated**: January 4, 2026  
**Tracked by**: Beads task tracking system  
**Status**: All optimization issues created and prioritized ✅
