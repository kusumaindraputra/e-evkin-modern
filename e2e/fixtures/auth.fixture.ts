import { test as base, type Page } from '@playwright/test';
import * as path from 'path';
import { ADMIN, PUSKESMAS } from '../helpers/test-data';

type AuthFixtures = {
  adminPage: Page;
  puskesmasPage: Page;
};

const ADMIN_STATE = path.resolve(__dirname, '../.auth/admin.json');
const PUSK_STATE  = path.resolve(__dirname, '../.auth/puskesmas.json');

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: ADMIN_STATE,
      ignoreHTTPSErrors: true,
    });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
  puskesmasPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: PUSK_STATE,
      ignoreHTTPSErrors: true,
    });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

export { expect } from '@playwright/test';

export async function setupAuth(browser: import('@playwright/test').Browser) {
  const fs = await import('fs');
  const authDir = path.resolve(__dirname, '../.auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const baseURL = process.env.TEST_BASE_URL ?? 'https://192.168.102.123';

  // Save admin state + token for API tests to reuse (avoids extra login requests)
  const adminCtx = await browser.newContext({ ignoreHTTPSErrors: true });
  const adminPage = await adminCtx.newPage();
  await adminPage.goto(baseURL + '/login');
  await adminPage.getByPlaceholder('Masukkan username').fill(ADMIN.username);
  await adminPage.getByPlaceholder('Masukkan password').fill(ADMIN.password);
  await adminPage.getByRole('button', { name: 'Masuk' }).click();
  await adminPage.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15_000 });
  await adminCtx.storageState({ path: ADMIN_STATE });
  // Extract JWT from Zustand persisted auth store while context is still open
  const adminToken = await adminPage.evaluate(() => {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return null;
    try { return JSON.parse(raw)?.state?.token ?? null; } catch { return null; }
  });
  fs.writeFileSync(
    path.resolve(authDir, 'tokens.json'),
    JSON.stringify({ adminToken }),
    'utf-8',
  );
  await adminCtx.close();

  // Save puskesmas state (skip gracefully if password not set)
  if (PUSKESMAS.password) {
    const puskCtx = await browser.newContext({ ignoreHTTPSErrors: true });
    const puskPage = await puskCtx.newPage();
    await puskPage.goto(baseURL + '/login');
    await puskPage.getByPlaceholder('Masukkan username').fill(PUSKESMAS.username);
    await puskPage.getByPlaceholder('Masukkan password').fill(PUSKESMAS.password);
    await puskPage.getByRole('button', { name: 'Masuk' }).click();
    await puskPage.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15_000 });
    await puskCtx.storageState({ path: PUSK_STATE });
    await puskCtx.close();
  } else {
    console.warn('TEST_PUSK_PASSWORD not set — puskesmas browser tests will be skipped');
  }
}
