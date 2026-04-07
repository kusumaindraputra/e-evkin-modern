/**
 * Local headless test for LaporanBulkInputPage card redesign
 * Tests: Login as puskesmas, navigate to laporan, verify card layout renders
 * Usage: npx tsx src/scripts/test_laporan_local.ts
 */
import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:5173';
const PUSKESMAS_USERNAME = 'leuwiliang';
const PUSKESMAS_PASSWORD = 'bogorkab';

async function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--ignore-certificate-errors'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Login as puskesmas
    console.log('\n=== Login as Puskesmas ===');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 15000 });
    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
      await inputs[0].type(PUSKESMAS_USERNAME);
      await inputs[1].type(PUSKESMAS_PASSWORD);
    }
    await page.click('button');
    await delay(3000);

    const afterLoginUrl = page.url();
    console.log(`After login: ${afterLoginUrl}`);
    if (afterLoginUrl.includes('login')) {
      console.log('❌ Login failed');
      return;
    }
    console.log('✅ Login OK');

    // Navigate to laporan input page
    console.log('\n=== Navigate to Laporan Input ===');
    await page.goto(`${BASE_URL}/puskesmas/laporan`, { waitUntil: 'networkidle2', timeout: 15000 });
    await delay(1000);
    console.log(`Laporan page: ${page.url()}`);

    // Check initial state - should show "Pilih bulan dan tahun"
    const emptyState = await page.$eval('body', (el) => el.textContent?.includes('Pilih bulan dan tahun') || false);
    console.log(emptyState ? '✅ Initial empty state shown' : '⚠️ Empty state not found');

    // Select bulan = Maret
    console.log('\n=== Select Bulan & Tahun ===');
    const selects = await page.$$('.ant-select-selector');
    console.log(`Found ${selects.length} select components`);

    if (selects.length >= 2) {
      // Click bulan selector
      await selects[0].click();
      await delay(500);
      // Select "Maret"
      const bulanOption = await page.waitForSelector('.ant-select-item[title="Maret"]', { timeout: 3000 });
      if (bulanOption) {
        await bulanOption.click();
        await delay(500);
        console.log('✅ Bulan Maret selected');
      }
    }

    // Wait for data to load
    await delay(3000);

    // === CHECK 1: Progress Header ===
    console.log('\n=== CHECK 1: Progress Header ===');
    const progressHeader = await page.$('.laporan-progress-header');
    console.log(progressHeader ? '✅ Progress header rendered' : '❌ Progress header NOT found');

    if (progressHeader) {
      const statsCards = await page.$$('.progress-stat-card');
      console.log(`  Stats cards: ${statsCards.length} (expected 4)`);

      const progressTitle = await page.$eval('.progress-title', el => el.textContent || '');
      console.log(`  Title: "${progressTitle}"`);
    }

    // === CHECK 2: Group Cards ===
    console.log('\n=== CHECK 2: Group Cards (Accordion) ===');
    const groupCards = await page.$$('.laporan-group-card');
    console.log(`Group cards: ${groupCards.length}`);

    if (groupCards.length > 0) {
      const groupHeaders = await page.$$('.laporan-group-header');
      for (let i = 0; i < Math.min(groupHeaders.length, 3); i++) {
        const headerText = await groupHeaders[i].evaluate(el => el.textContent || '');
        console.log(`  Group ${i + 1}: "${headerText.trim().substring(0, 80)}..."`);
      }

      // Check badge
      const badges = await page.$$('.group-badge');
      console.log(`  Badges rendered: ${badges.length}`);
    }

    // === CHECK 3: Input Cards ===
    console.log('\n=== CHECK 3: Input Cards ===');
    const inputCards = await page.$$('.laporan-input-card');
    console.log(`Input cards: ${inputCards.length}`);

    if (inputCards.length > 0) {
      // Check card structure
      const metaRows = await page.$$('.input-card-meta');
      console.log(`  Meta rows: ${metaRows.length}`);

      const targetSections = await page.$$('.target-section');
      console.log(`  Target sections: ${targetSections.length}`);

      const realisasiSections = await page.$$('.realisasi-section');
      console.log(`  Realisasi sections: ${realisasiSections.length}`);

      const capaianBars = await page.$$('.capaian-bar');
      console.log(`  Capaian bars: ${capaianBars.length}`);

      // Check status classes
      const emptyCards = await page.$$('.status-empty');
      const savedCards = await page.$$('.status-tersimpan');
      const sentCards = await page.$$('.status-terkirim');
      console.log(`  Status - Empty: ${emptyCards.length}, Saved: ${savedCards.length}, Sent: ${sentCards.length}`);
    }

    // === CHECK 4: Collapse/Expand Animation ===
    console.log('\n=== CHECK 4: Collapse/Expand ===');
    if (groupCards.length > 0) {
      const firstHeader = await page.$('.laporan-group-header');
      if (firstHeader) {
        // Click to collapse
        await firstHeader.click();
        await delay(400);

        const hiddenBody = await page.$('.group-body-hidden');
        console.log(hiddenBody ? '✅ Collapse works (group-body-hidden found)' : '❌ Collapse failed');

        // Click to expand again
        await firstHeader.click();
        await delay(400);

        const visibleBody = await page.$('.group-body-visible');
        console.log(visibleBody ? '✅ Expand works (group-body-visible found)' : '❌ Expand failed');
      }
    }

    // === CHECK 5: Action Bar ===
    console.log('\n=== CHECK 5: Sticky Action Bar ===');
    const actionBar = await page.$('.laporan-action-bar');
    console.log(actionBar ? '✅ Action bar rendered' : '❌ Action bar NOT found');

    if (actionBar) {
      const saveBtn = await page.$eval('.action-bar-buttons button:first-child', el => el.textContent || '');
      console.log(`  Save button: "${saveBtn}"`);
    }

    // === CHECK 6: Extras toggle (Permasalahan & Upaya) ===
    console.log('\n=== CHECK 6: Permasalahan & Upaya toggle ===');
    const extrasToggle = await page.$('.extras-toggle');
    if (extrasToggle) {
      await extrasToggle.click();
      await delay(300);
      const extrasFields = await page.$('.extras-fields');
      console.log(extrasFields ? '✅ Extras expand works' : '❌ Extras expand failed');
    } else {
      console.log('⚠️ No extras toggle found');
    }

    // Take screenshot
    await page.screenshot({ path: 'test_laporan_cards_local.png', fullPage: false });
    console.log('\n📸 Screenshot saved: test_laporan_cards_local.png');

    console.log('\n=== ALL LOCAL TESTS COMPLETE ===');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
}

main();
