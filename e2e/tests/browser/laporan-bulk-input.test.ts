import { test, expect } from '../../fixtures/auth.fixture';
import { TEST_BULAN, TEST_TAHUN, PUSKESMAS } from '../../helpers/test-data';

test.describe('Laporan bulk input', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!PUSKESMAS.password) {
      testInfo.skip();
    }
  });

  test('puskesmas laporan page loads for Maret 2026', async ({ puskesmasPage: page }) => {
    await page.goto(`/laporan?bulan=${TEST_BULAN}&tahun=${TEST_TAHUN}`);
    await expect(page.locator('body')).not.toContainText('Something went wrong', { timeout: 10_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  });

  test('at least one realisasi field shows LRA label', async ({ puskesmasPage: page }) => {
    await page.goto(`/laporan?bulan=${TEST_BULAN}&tahun=${TEST_TAHUN}`);
    const lraLabel = page.getByText('Dari LRA').first();
    await expect(lraLabel).toBeVisible({ timeout: 15_000 });
  });

  test('realisasi_rp display is visible when LRA data available', async ({ puskesmasPage: page }) => {
    await page.goto(`/laporan?bulan=${TEST_BULAN}&tahun=${TEST_TAHUN}`);
    await page.getByText('Dari LRA').first().waitFor({ timeout: 15_000 });
    const realisasiDisplay = page.locator('text=/Rp /').first();
    await expect(realisasiDisplay).toBeVisible({ timeout: 5_000 });
  });
});
