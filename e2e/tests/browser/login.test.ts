import { test, expect } from '@playwright/test';
import { ADMIN, PUSKESMAS } from '../../helpers/test-data';

test.describe('Login flow', () => {
  test('admin login redirects to /dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan username').fill(ADMIN.username);
    await page.getByPlaceholder('Masukkan password').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Masuk' }).click();
    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('puskesmas login redirects to /puskesmas/dashboard', async ({ page }) => {
    test.skip(!PUSKESMAS.password, 'TEST_PUSK_PASSWORD not set');
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan username').fill(PUSKESMAS.username);
    await page.getByPlaceholder('Masukkan password').fill(PUSKESMAS.password);
    await page.getByRole('button', { name: 'Masuk' }).click();
    await page.waitForURL('**/puskesmas/**', { timeout: 15_000 });
    expect(page.url()).toContain('/puskesmas/');
  });

  test('wrong credentials shows error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan username').fill('wronguser_xyz');
    await page.getByPlaceholder('Masukkan password').fill('wrongpass_xyz');
    await page.getByRole('button', { name: 'Masuk' }).click();
    const errorMsg = page.locator('.ant-message-notice');
    await expect(errorMsg).toBeVisible({ timeout: 5_000 });
  });

  test('logout returns to /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan username').fill(ADMIN.username);
    await page.getByPlaceholder('Masukkan password').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Masuk' }).click();
    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    // "Keluar" is inside a Dropdown triggered by clicking the user profile avatar
    await page.locator('.user-profile').click();
    await page.getByText('Keluar').click();
    await page.waitForURL('**/login', { timeout: 5_000 });
    expect(page.url()).toContain('/login');
  });
});
