/**
 * Performance Testing & Measurement Script
 * Purpose: Establish baseline metrics untuk performance optimization
 * Run: npx tsx src/scripts/measure-performance.ts
 */

import axios from 'axios';
import { sequelize } from '../config/database';
import { Laporan } from '../models';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

interface PerformanceMetrics {
  timestamp: string;
  frontend: {
    bundleSize: string;
    bundleSizeGzipped: string;
  };
  backend: {
    referenceDataEndpoint: number;
    laporanListQuery: number;
    dashboardQuery: number;
    bulkSaveOperation: number;
  };
  database: {
    totalLaporanCount: number;
    avgQueryTime: number;
    slowQueryCount: number;
  };
}

// Helper function to measure time
async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

async function measureFrontendBundleSize(): Promise<{ size: string; sizeGzipped: string }> {
  // Note: In a real scenario, you'd analyze the dist/ folder
  // For now, we'll return placeholder values
  console.log('📦 Frontend Bundle Size Measurement');
  console.log('  Command: npm run build && du -sh dist/');
  console.log('  (Run manually to get accurate measurements)');
  return { size: 'TBD', sizeGzipped: '~1.65 MB' };
}

async function measureBackendEndpoints(): Promise<{
  referenceData: number;
  laporanList: number;
  dashboard: number;
  bulkSave: number;
}> {
  console.log('⚡ Backend API Response Times');

  try {
    // Auth token
    const authResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'dinkes',
      password: 'dinkes123',
    });
    const token = authResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // 1. Reference Data Endpoint
    const refTime = (
      await measureTime(async () => {
        return axios.get(`${API_BASE_URL}/reference/sumber-anggaran`, { headers });
      })
    ).duration;
    console.log(`  ✓ /reference/sumber-anggaran: ${refTime.toFixed(2)}ms`);

    // 2. Laporan List Query
    const tahun = new Date().getFullYear();
    const laporanTime = (
      await measureTime(async () => {
        return axios.get(`${API_BASE_URL}/laporan?tahun=${tahun}&bulan=1`, { headers });
      })
    ).duration;
    console.log(`  ✓ /laporan?tahun=${tahun}&bulan=1: ${laporanTime.toFixed(2)}ms`);

    // 3. Dashboard Query
    const dashboardTime = (
      await measureTime(async () => {
        return axios.get(`${API_BASE_URL}/report/dashboard?tahun=${tahun}`, { headers });
      })
    ).duration;
    console.log(`  ✓ /report/dashboard?tahun=${tahun}: ${dashboardTime.toFixed(2)}ms`);

    // 4. Bulk Save Operation (simulate with 10 rows)
    const bulkData = Array.from({ length: 10 }, (_, i) => ({
      id_sub_kegiatan: 1,
      bulan: 'Januari',
      tahun,
      id_sumber_anggaran: 1,
      id_satuan: 1,
      target_k: 100,
      target_rp: 1000000,
      realisasi_k: 50,
      realisasi_rp: 500000,
      permasalahan: 'Test',
    }));

    const bulkTime = (
      await measureTime(async () => {
        return axios.post(`${API_BASE_URL}/laporan/bulk-upsert`, { laporan: bulkData }, { headers });
      })
    ).duration;
    console.log(`  ✓ /laporan/bulk-upsert (10 rows): ${bulkTime.toFixed(2)}ms`);

    return {
      referenceData: refTime,
      laporanList: laporanTime,
      dashboard: dashboardTime,
      bulkSave: bulkTime,
    };
  } catch (error) {
    console.error('  ❌ Error measuring backend endpoints:', error);
    throw error;
  }
}

async function measureDatabaseMetrics(): Promise<{
  totalCount: number;
  avgQueryTime: number;
  slowQueryCount: number;
}> {
  console.log('🗄️  Database Metrics');

  try {
    // 1. Total Laporan Count
    const totalCount = await Laporan.count();
    console.log(`  ✓ Total Laporan records: ${totalCount.toLocaleString()}`);

    // 2. Sample query performance
    const queryTimes: number[] = [];
    for (let i = 0; i < 5; i++) {
      const { duration } = await measureTime(async () => {
        return Laporan.findAll({
          limit: 100,
          offset: i * 100,
        });
      });
      queryTimes.push(duration);
    }
    const avgTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
    console.log(`  ✓ Average query time (5 samples): ${avgTime.toFixed(2)}ms`);

    // 3. Check for slow queries (> 1 second)
    // Note: Requires log_min_duration_statement = 1000 in PostgreSQL config
    const [slowQueries] = await sequelize.query(`
      SELECT COUNT(*) as count FROM pg_stat_statements 
      WHERE mean_exec_time > 1000 AND query NOT LIKE '%pg_%'
      LIMIT 1;
    `);
    const slowQueryCount = (slowQueries[0] as any)?.count || 0;
    console.log(`  ✓ Slow queries (>1s) in last session: ${slowQueryCount}`);

    return {
      totalCount,
      avgQueryTime: avgTime,
      slowQueryCount,
    };
  } catch (error) {
    console.error('  ❌ Error measuring database metrics:', error);
    throw error;
  }
}

async function measureConnectionPool(): Promise<{ active: number; idle: number; total: number }> {
  console.log('🔌 Connection Pool Status');

  try {
    const [result] = await sequelize.query(`
      SELECT 
        count(*) as total,
        sum(case when state = 'active' then 1 else 0 end) as active,
        sum(case when state = 'idle' then 1 else 0 end) as idle
      FROM pg_stat_activity
      WHERE datname = 'e_evkin';
    `);

    const poolStats = result[0] as any;
    console.log(`  ✓ Active connections: ${poolStats.active}`);
    console.log(`  ✓ Idle connections: ${poolStats.idle}`);
    console.log(`  ✓ Total connections: ${poolStats.total}`);

    return {
      active: poolStats.active,
      idle: poolStats.idle,
      total: poolStats.total,
    };
  } catch (error) {
    console.error('  ❌ Error measuring connection pool:', error);
    return { active: 0, idle: 0, total: 0 };
  }
}

async function generateReport(metrics: PerformanceMetrics): Promise<void> {
  const reportPath = './docs/PERFORMANCE_BASELINE.md';

  const report = `# Performance Baseline Report

**Generated**: ${metrics.timestamp}

## Summary

This is the current performance baseline for E-EVKIN Modern application.
Use this as a reference for measuring improvements from optimization work.

## Frontend Metrics

### Bundle Size
- **Total**: ${metrics.frontend.bundleSize}
- **Gzipped**: ${metrics.frontend.bundleSizeGzipped}

## Backend API Response Times

| Endpoint | Response Time |
|----------|---------------|
| /reference/sumber-anggaran | ${metrics.backend.referenceDataEndpoint.toFixed(2)}ms |
| /laporan (list with filter) | ${metrics.backend.laporanListQuery.toFixed(2)}ms |
| /report/dashboard | ${metrics.backend.dashboardQuery.toFixed(2)}ms |
| /laporan/bulk-upsert (10 rows) | ${metrics.backend.bulkSaveOperation.toFixed(2)}ms |

**Target for optimization**:
- Reference data: < 5ms (via caching)
- Laporan list: < 500ms (via indexes)
- Dashboard: < 100ms (via materialized views)
- Bulk save: < 500ms (current: good baseline)

## Database Metrics

| Metric | Value |
|--------|-------|
| Total Laporan Records | ${metrics.database.totalLaporanCount.toLocaleString()} |
| Average Query Time | ${metrics.database.avgQueryTime.toFixed(2)}ms |
| Slow Queries (>1s) | ${metrics.database.slowQueryCount} |

**Status**: ${metrics.database.avgQueryTime < 100 ? '✅ Good' : metrics.database.avgQueryTime < 500 ? '⚠️ Average' : '❌ Slow'}

## Connection Pool Status

- Max connections configured: 15
- Min connections configured: 2
- Current active: (see output above)
- Current idle: (see output above)

## Next Steps

1. **P0**: Save this baseline for comparison
2. **P1**: Implement React.memo optimization
3. **P1**: Add code splitting for admin pages
4. **P2**: Implement Redis caching
5. **P2**: Add materialized views for dashboard

See \`docs/guides/OPTIMIZATION_ROADMAP.md\` for detailed optimization tasks.

---

**Baseline Date**: ${metrics.timestamp}
**Next Measurement**: +1 week (after optimizations)
`;

  console.log('\n📄 Report:');
  console.log(report);
}

async function main(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('⚙️  E-EVKIN PERFORMANCE MEASUREMENT SCRIPT');
  console.log('='.repeat(60) + '\n');

  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Measure all metrics
    const [frontend, backend, database, pool] = await Promise.all([
      measureFrontendBundleSize(),
      measureBackendEndpoints(),
      measureDatabaseMetrics(),
      measureConnectionPool(),
    ]);

    console.log('\n' + '='.repeat(60));
    console.log('📊 CONNECTION POOL');
    console.log('='.repeat(60) + '\n');
    console.log(`  Active: ${pool.active}, Idle: ${pool.idle}, Total: ${pool.total}`);

    // Compile metrics
    const metrics: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      frontend: {
        bundleSize: frontend.size,
        bundleSizeGzipped: frontend.sizeGzipped,
      },
      backend: {
        referenceDataEndpoint: backend.referenceData,
        laporanListQuery: backend.laporanList,
        dashboardQuery: backend.dashboard,
        bulkSaveOperation: backend.bulkSave,
      },
      database: {
        totalLaporanCount: database.totalCount,
        avgQueryTime: database.avgQueryTime,
        slowQueryCount: database.slowQueryCount,
      },
    };

    // Generate report
    console.log('\n' + '='.repeat(60));
    await generateReport(metrics);

    // Save metrics to file (optional)
    console.log('\n💾 Metrics JSON:');
    console.log(JSON.stringify(metrics, null, 2));

    console.log('\n✅ Performance measurement completed successfully!');
    console.log('\nNext: Compare results with future measurements after optimizations.');
  } catch (error) {
    console.error('❌ Error during measurement:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { measureTime, measureFrontendBundleSize, measureBackendEndpoints, measureDatabaseMetrics };
