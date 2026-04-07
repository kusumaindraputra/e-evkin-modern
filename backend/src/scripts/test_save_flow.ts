/**
 * E2E test specifically for save flow - validates the backend validation fix
 * Usage: npx tsx src/scripts/test_save_flow.ts
 */
import puppeteer from 'puppeteer';

const BASE_URL = 'http://192.168.102.123';
const USERNAME = 'leuwiliang';
const PASSWORD = 'bogorkab';

async function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--ignore-certificate-errors'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Capture API responses
    const apiResponses: { url: string; status: number; body: string }[] = [];
    page.on('response', async (res) => {
      if (res.url().includes('/api/laporan')) {
        try {
          const body = await res.text();
          apiResponses.push({ url: res.url(), status: res.status(), body: body.substring(0, 500) });
        } catch {}
      }
    });

    // Login
    console.log('=== LOGIN ===');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
      await inputs[0].type(USERNAME);
      await inputs[1].type(PASSWORD);
    }
    await page.click('button');
    await delay(4000);
    console.log(`Logged in: ${page.url()}`);

    // Navigate to laporan — should auto-load with previous month
    console.log('\n=== NAVIGATE TO LAPORAN ===');
    await page.goto(`${BASE_URL}/puskesmas/laporan`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(5000);

    // Check auto-select
    const selectedBulan = await page.$$eval('.ant-select-selection-item', els => els.map(el => el.textContent || ''));
    console.log(`Auto-selected filters: ${selectedBulan.join(', ')}`);

    // Find the first empty card
    const emptyCard = await page.$('.status-empty');
    if (!emptyCard) {
      console.log('No empty cards to test save. Trying with saved card instead.');

      // Use first saved card
      const savedCard = await page.$('.status-tersimpan');
      if (!savedCard) {
        console.log('No cards available to test');
        return;
      }
    }

    const targetCard = emptyCard || await page.$('.status-tersimpan');
    if (!targetCard) return;

    // Read current state
    const cardKode = await targetCard.$eval('.ant-tag:first-child', el => el.textContent || '').catch(() => 'unknown');
    console.log(`\n=== TESTING SAVE ON CARD: ${cardKode} ===`);

    // Get target values
    const targetValues = await targetCard.$$eval('.target-section .data-value', els => els.map(el => el.textContent || ''));
    console.log(`Target values: ${targetValues.join(' | ')}`);

    // Input realisasi values
    const realisasiInputs = await targetCard.$$('.realisasi-section .ant-input-number-input');
    console.log(`Found ${realisasiInputs.length} realisasi inputs`);

    if (realisasiInputs.length >= 3) {
      // Clear and input Realisasi Anggaran
      await realisasiInputs[0].click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await realisasiInputs[0].type('100000');
      await delay(200);

      // Clear and input Realisasi Kinerja
      await realisasiInputs[1].click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await realisasiInputs[1].type('0');
      await delay(200);

      // Clear and input Realisasi Fisik
      await realisasiInputs[2].click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await realisasiInputs[2].type('5');
      await delay(200);

      // Blur
      await page.click('.laporan-progress-header');
      await delay(500);

      // Check capaian updated realtime
      const capaianAfter = await targetCard.$$eval('.capaian-text', els => els.map(el => el.textContent || ''));
      console.log(`Capaian after input (realtime): ${capaianAfter.join(', ')}`);

      // Read back values
      const valuesAfter = [];
      for (const inp of realisasiInputs) {
        const val = await inp.evaluate((el: any) => el.value || '');
        valuesAfter.push(val);
      }
      console.log(`Input values: ${valuesAfter.join(', ')}`);
    }

    // Click Save
    console.log('\n=== CLICKING SAVE ===');
    apiResponses.length = 0; // Clear

    const saveBtn = await page.$('.action-bar-buttons button:first-child');
    if (saveBtn) {
      await saveBtn.click();
      await delay(5000);

      // Check API response
      const bulkUpsertResp = apiResponses.find(r => r.url.includes('bulk-upsert'));
      if (bulkUpsertResp) {
        console.log(`API Response: ${bulkUpsertResp.status}`);
        console.log(`Body: ${bulkUpsertResp.body}`);

        const parsed = JSON.parse(bulkUpsertResp.body);
        if (parsed.success) {
          console.log(`✅ Save SUCCESS: created=${parsed.results.created}, updated=${parsed.results.updated}, skipped=${parsed.results.skipped}`);
          if (parsed.results.errors?.length > 0) {
            console.log(`⚠️ Errors: ${JSON.stringify(parsed.results.errors)}`);
          }
        } else {
          console.log(`❌ Save FAILED: ${parsed.error}`);
        }
      } else {
        console.log('⚠️ No bulk-upsert API response captured');
        console.log('All API responses:', apiResponses.map(r => `${r.status} ${r.url}`));
      }

      // Check success message in UI
      await delay(1000);
      const msgSuccess = await page.$eval('.ant-message-success', el => el.textContent || '').catch(() => '');
      const msgError = await page.$eval('.ant-message-error', el => el.textContent || '').catch(() => '');
      const msgWarning = await page.$eval('.ant-message-warning', el => el.textContent || '').catch(() => '');
      if (msgSuccess) console.log(`✅ UI message: "${msgSuccess}"`);
      if (msgError) console.log(`❌ UI error: "${msgError}"`);
      if (msgWarning) console.log(`⚠️ UI warning: "${msgWarning}"`);
    }

    // Verify data persisted — reload page
    console.log('\n=== VERIFY PERSISTENCE ===');
    await page.goto(`${BASE_URL}/puskesmas/laporan`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(5000);

    // Check filter persistence
    const persistedFilters = await page.$$eval('.ant-select-selection-item', els => els.map(el => el.textContent || ''));
    console.log(`Persisted filters: ${persistedFilters.join(', ')}`);

    // Check card status after reload
    const emptyAfter = (await page.$$('.status-empty')).length;
    const savedAfter = (await page.$$('.status-tersimpan')).length;
    const sentAfter = (await page.$$('.status-terkirim')).length;
    console.log(`After reload → Empty: ${emptyAfter}, Saved: ${savedAfter}, Sent: ${sentAfter}`);

    // Check the card we saved — find by kode
    const allCards = await page.$$('.laporan-input-card');
    for (const card of allCards) {
      const kode = await card.$eval('.ant-tag:first-child', el => el.textContent || '').catch(() => '');
      if (kode === cardKode) {
        const values = [];
        const cardInputs = await card.$$('.realisasi-section .ant-input-number-input');
        for (const inp of cardInputs) {
          const val = await inp.evaluate((el: any) => el.value || '');
          values.push(val);
        }
        console.log(`Card ${cardKode} realisasi after reload: ${values.join(', ')}`);

        const hasValue = values.some(v => v !== '' && v !== '0');
        console.log(hasValue ? '✅ Data persisted correctly!' : '❌ Data NOT persisted — still empty/zero');
        break;
      }
    }

    await page.screenshot({ path: 'test_save_flow.png', fullPage: false });
    console.log('\n📸 test_save_flow.png');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

main();
