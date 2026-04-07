/**
 * Production headless test for LaporanBulkInputPage card redesign
 * Usage: npx tsx src/scripts/test_laporan_prod.ts
 */
import puppeteer from 'puppeteer';

const BASE_URL = 'http://192.168.102.123';
const PUSKESMAS_USERNAME = 'leuwiliang';
const PUSKESMAS_PASSWORD = 'bogorkab';

async function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--ignore-certificate-errors'],
  });

  let passed = 0;
  let failed = 0;

  function check(label: string, ok: boolean) {
    if (ok) { passed++; console.log(`✅ ${label}`); }
    else { failed++; console.log(`❌ ${label}`); }
  }

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // === LOGIN ===
    console.log('\n=== LOGIN ===');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
      await inputs[0].type(PUSKESMAS_USERNAME);
      await inputs[1].type(PUSKESMAS_PASSWORD);
    }
    await page.click('button');
    await delay(4000);

    const afterLoginUrl = page.url();
    check('Login successful', !afterLoginUrl.includes('login'));
    if (afterLoginUrl.includes('login')) {
      console.log('Cannot proceed without login');
      return;
    }

    // === NAVIGATE TO LAPORAN ===
    console.log('\n=== NAVIGATE TO LAPORAN ===');
    await page.goto(`${BASE_URL}/puskesmas/laporan`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(1000);
    check('Laporan page loaded', page.url().includes('laporan'));

    // Check initial state
    const emptyState = await page.$eval('body', el => el.textContent?.includes('Pilih bulan') || false);
    check('Initial empty state shown', emptyState);

    // === SELECT BULAN ===
    console.log('\n=== SELECT FILTERS ===');
    const selects = await page.$$('.ant-select-selector');
    check('Filter selects found', selects.length >= 2);

    if (selects.length >= 2) {
      await selects[0].click();
      await delay(500);
      try {
        const bulanOption = await page.waitForSelector('.ant-select-item[title="Maret"]', { timeout: 3000 });
        if (bulanOption) {
          await bulanOption.click();
          console.log('  Selected: Maret');
        }
      } catch {
        console.log('  ⚠️ Could not select Maret, trying first option');
        const firstOption = await page.$('.ant-select-item');
        if (firstOption) await firstOption.click();
      }
    }

    await delay(4000);

    // === CHECK PROGRESS HEADER ===
    console.log('\n=== PROGRESS HEADER ===');
    const progressHeader = await page.$('.laporan-progress-header');
    check('Progress header rendered', !!progressHeader);

    if (progressHeader) {
      const statsCards = await page.$$('.progress-stat-card');
      check(`Stats cards: ${statsCards.length} (expect 4)`, statsCards.length === 4);

      const progressTitle = await page.$eval('.progress-title', el => el.textContent || '').catch(() => '');
      check(`Title contains "Laporan Kinerja"`, progressTitle.includes('Laporan Kinerja'));
      console.log(`  Title: "${progressTitle}"`);

      // Check progress bar
      const progressBar = await page.$('.progress-bar-fill');
      check('Progress bar rendered', !!progressBar);
    }

    // === CHECK GROUP CARDS ===
    console.log('\n=== GROUP CARDS ===');
    const groupCards = await page.$$('.laporan-group-card');
    check(`Group cards rendered: ${groupCards.length}`, groupCards.length > 0);

    if (groupCards.length > 0) {
      const badges = await page.$$('.group-badge');
      check(`Badges rendered: ${badges.length}`, badges.length === groupCards.length);

      // Show first 3 group titles
      const groupHeaders = await page.$$('.laporan-group-header');
      for (let i = 0; i < Math.min(groupHeaders.length, 3); i++) {
        const text = await groupHeaders[i].evaluate(el => el.textContent?.trim().substring(0, 80) || '');
        console.log(`  Group ${i + 1}: "${text}"`);
      }
    }

    // === CHECK INPUT CARDS ===
    console.log('\n=== INPUT CARDS ===');
    const inputCards = await page.$$('.laporan-input-card');
    check(`Input cards rendered: ${inputCards.length}`, inputCards.length > 0);

    if (inputCards.length > 0) {
      const metaRows = await page.$$('.input-card-meta');
      check('Meta rows match card count', metaRows.length === inputCards.length);

      const targetSections = await page.$$('.target-section');
      check(`Target sections: ${targetSections.length}`, targetSections.length === inputCards.length);

      const realisasiSections = await page.$$('.realisasi-section');
      check(`Realisasi sections: ${realisasiSections.length}`, realisasiSections.length === inputCards.length);

      const capaianBars = await page.$$('.capaian-bar');
      check(`Capaian bars: ${capaianBars.length}`, capaianBars.length > 0);

      // Status distribution
      const emptyCards = await page.$$('.status-empty');
      const savedCards = await page.$$('.status-tersimpan');
      const sentCards = await page.$$('.status-terkirim');
      console.log(`  Status → Empty: ${emptyCards.length}, Saved: ${savedCards.length}, Sent: ${sentCards.length}`);
    }

    // === CHECK COLLAPSE/EXPAND ===
    console.log('\n=== COLLAPSE/EXPAND ===');
    if (groupCards.length > 0) {
      const firstHeader = await page.$('.laporan-group-header');
      if (firstHeader) {
        await firstHeader.click();
        await delay(400);
        const hiddenBody = await page.$('.group-body-hidden');
        check('Collapse works', !!hiddenBody);

        await firstHeader.click();
        await delay(400);
        const visibleBody = await page.$('.group-body-visible');
        check('Expand works', !!visibleBody);
      }
    }

    // === CHECK ACTION BAR ===
    console.log('\n=== ACTION BAR ===');
    const actionBar = await page.$('.laporan-action-bar');
    check('Action bar rendered', !!actionBar);

    if (actionBar) {
      const buttons = await page.$$('.action-bar-buttons button');
      check(`Action buttons: ${buttons.length} (expect 2)`, buttons.length === 2);
    }

    // === CHECK EXTRAS TOGGLE ===
    console.log('\n=== PERMASALAHAN/UPAYA TOGGLE ===');
    const extrasToggle = await page.$('.extras-toggle');
    if (extrasToggle) {
      await extrasToggle.click();
      await delay(300);
      const extrasFields = await page.$('.extras-fields');
      check('Extras expand works', !!extrasFields);
    } else {
      console.log('  ⚠️ No extras toggle found');
    }

    // === SCREENSHOT ===
    await page.screenshot({ path: 'test_laporan_cards_prod.png', fullPage: false });
    console.log('\n📸 Screenshot: test_laporan_cards_prod.png');

    // === SUMMARY ===
    console.log(`\n${'='.repeat(40)}`);
    console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} checks`);
    console.log(`${'='.repeat(40)}`);

    if (failed > 0) process.exitCode = 1;

  } catch (err) {
    console.error('Test error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
