import { test, expect } from '../../fixtures/auth.fixture';
import * as path from 'path';

const LRA_FILE = path.resolve(__dirname, '../../fixtures/files/lra_sample_maret.xlsx');

test.describe('LRA Upload flow', () => {
  test('admin can upload LRA file and confirm to database', async ({ adminPage: page }) => {
    test.setTimeout(120_000); // preview + confirm can be slow on prod server
    await page.goto('/admin/lra-upload');
    await expect(page.getByText('Upload LRA Realisasi Anggaran')).toBeVisible({ timeout: 10_000 });

    // Select bulan via Ant Design Select
    await page.locator('.ant-select').first().click();
    // Use the ant-select-item option with exact title "Maret" to avoid matching table cells
    await page.locator('.ant-select-item-option[title="Maret"]').click();

    // Set tahun
    const tahunInput = page.locator('input.ant-input-number-input');
    await tahunInput.clear();
    await tahunInput.fill('2026');

    // Upload file via Ant Design Dragger using filechooser event
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('.ant-upload-drag').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(LRA_FILE);

    // Wait for file to appear in the list
    await expect(page.locator('.ant-upload-list-item')).toBeVisible({ timeout: 5_000 });

    // Click Preview
    await page.getByRole('button', { name: 'Preview' }).click();

    // Wait for result — preview can be slow on prod server
    await expect(page.getByText(/baris berhasil dicocokkan/)).toBeVisible({ timeout: 30_000 });

    // Confirm save
    await page.getByRole('button', { name: 'Simpan ke Database' }).click();

    // Wait for success — use first() to avoid strict mode violation with nested ant-message elements
    await expect(page.locator('.ant-message-notice').first()).toBeVisible({ timeout: 15_000 });
  });

  test('history table shows Maret 2026 batch', async ({ adminPage: page }) => {
    await page.goto('/admin/lra-upload');
    await expect(page.getByText('Riwayat Upload')).toBeVisible({ timeout: 10_000 });
    const tableBody = page.locator('.ant-table-tbody');
    await expect(tableBody).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.ant-table-tbody')).toContainText('Maret');
  });
});
