import { test, expect } from '@playwright/test';
import { ADMIN, API } from '../../helpers/test-data';

test.describe('Auth API', () => {
  test('POST /auth/login — valid credentials returns token', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { username: ADMIN.username, password: ADMIN.password },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(20);
  });

  test('POST /auth/login — wrong password returns 401', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { username: ADMIN.username, password: 'wrongpassword_xyz' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  test('POST /auth/login — missing fields returns 400', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('GET /laporan — without token returns 401', async ({ request }) => {
    const res = await request.get(`${API}/laporan`);
    expect(res.status()).toBe(401);
  });
});
