import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { ADMIN, API, TEST_BULAN, TEST_TAHUN } from '../../helpers/test-data';

const LRA_FILE = path.resolve(__dirname, '../../fixtures/files/lra_sample_maret.xlsx');

test.describe('LRA API', () => {
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { username: ADMIN.username, password: ADMIN.password },
    });
    adminToken = (await res.json()).token;
  });

  test('POST /lra/preview with file returns matchedCount >= 100', async ({ request }) => {
    const fileBuffer = fs.readFileSync(LRA_FILE);
    const res = await request.post(`${API}/lra/preview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      multipart: {
        file: {
          name: 'lra_sample_maret.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: fileBuffer,
        },
        bulan: TEST_BULAN,
        tahun: String(TEST_TAHUN),
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('matchedCount');
    expect(body.matchedCount).toBeGreaterThanOrEqual(100);
    expect(body.bulan).toBe(TEST_BULAN);
    expect(body.tahun).toBe(TEST_TAHUN);
  });

  test('POST /lra/confirm with file returns success and rowCount >= 100', async ({ request }) => {
    const fileBuffer = fs.readFileSync(LRA_FILE);
    const res = await request.post(`${API}/lra/confirm`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      multipart: {
        file: {
          name: 'lra_sample_maret.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: fileBuffer,
        },
        bulan: TEST_BULAN,
        tahun: String(TEST_TAHUN),
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.rowCount).toBeGreaterThanOrEqual(100);
  });

  test('GET /lra/batches returns array with at least one Maret 2026 batch', async ({ request }) => {
    const res = await request.get(`${API}/lra/batches`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    const maretBatches = body.filter((b: any) => b.bulan === TEST_BULAN && b.tahun === TEST_TAHUN);
    expect(maretBatches.length).toBeGreaterThan(0);
  });

  test('POST /lra/preview without file returns 400', async ({ request }) => {
    const res = await request.post(`${API}/lra/preview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      multipart: { bulan: TEST_BULAN, tahun: String(TEST_TAHUN) },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /lra/preview without bulan/tahun uses undetectable filename', async ({ request }) => {
    const fileBuffer = fs.readFileSync(LRA_FILE);
    const res = await request.post(`${API}/lra/preview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      multipart: {
        file: {
          name: 'nodate.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: fileBuffer,
        },
      },
    });
    // Backend returns 400 when bulan/tahun cannot be detected from filename
    expect([200, 400]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body).toHaveProperty('matchedCount');
    }
  });
});
