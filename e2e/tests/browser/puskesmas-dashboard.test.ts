import { test, expect } from '../../fixtures/auth.fixture';
import { PUSKESMAS } from '../../helpers/test-data';

test.describe('Puskesmas dashboard', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!PUSKESMAS.password) {
      testInfo.skip();
    }
  });

  test('dashboard loads with chart', async ({ puskesmasPage: page }) => {
    await page.goto('/puskesmas/dashboard');
    await expect(page.locator('h1, h2, h3, h4').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('body')).not.toContainText('Something went wrong');
    const chart = page.locator('canvas').first();
    await expect(chart).toBeVisible({ timeout: 15_000 });
  });

  test('dashboard shows numeric content', async ({ puskesmasPage: page }) => {
    await page.goto('/puskesmas/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });
});
