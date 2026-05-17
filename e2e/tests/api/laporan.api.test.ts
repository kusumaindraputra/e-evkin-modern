import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { PUSKESMAS, API, TEST_BULAN, TEST_TAHUN } from '../../helpers/test-data';

test.describe('Laporan API', () => {
  let adminToken: string;

  test.beforeAll(async () => {
    // Reuse token saved by globalSetup — avoids extra login requests that can hit rate limits
    const tokensPath = path.resolve(__dirname, '../../.auth/tokens.json');
    const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    adminToken = tokens.adminToken;
  });

  test('GET /laporan as admin with user_id returns rows', async ({ request }) => {
    const res = await request.get(
      `${API}/laporan?bulan=${TEST_BULAN}&tahun=${TEST_TAHUN}&user_id=${PUSKESMAS.id}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    const rows = Array.isArray(body) ? body : body.data ?? [];
    expect(rows.length).toBeGreaterThan(0);
  });

  test('GET /laporan rows include realisasi_rp_lra field', async ({ request }) => {
    const res = await request.get(
      `${API}/laporan?bulan=${TEST_BULAN}&tahun=${TEST_TAHUN}&user_id=${PUSKESMAS.id}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const body = await res.json();
    const rows = Array.isArray(body) ? body : body.data ?? [];
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row: any) => {
      expect(row).toHaveProperty('realisasi_rp_lra');
    });
  });

  test('GET /laporan rows for leuwiliang Maret 2026 have non-zero realisasi_rp_lra', async ({ request }) => {
    const res = await request.get(
      `${API}/laporan?bulan=${TEST_BULAN}&tahun=${TEST_TAHUN}&user_id=${PUSKESMAS.id}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const body = await res.json();
    const rows = Array.isArray(body) ? body : body.data ?? [];
    const enrichedRows = rows.filter((r: any) => Number(r.realisasi_rp_lra) > 0);
    expect(enrichedRows.length).toBeGreaterThan(0);
  });

  test('GET /laporan without token returns 401', async ({ request }) => {
    const res = await request.get(`${API}/laporan?bulan=${TEST_BULAN}&tahun=${TEST_TAHUN}`);
    expect(res.status()).toBe(401);
  });
});
