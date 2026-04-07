/**
 * Comprehensive E2E test for LaporanBulkInputPage on production
 * Tests full flow: login → filter → inspect UI → input data → save → verify
 * Usage: npx tsx src/scripts/test_e2e_laporan.ts
 */
import puppeteer, { type Page } from 'puppeteer';

const BASE_URL = 'http://192.168.102.123';
const PUSKESMAS_USERNAME = 'leuwiliang';
const PUSKESMAS_PASSWORD = 'bogorkab';

async function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

const findings: { type: 'bug' | 'inconsistency' | 'improvement' | 'info'; msg: string }[] = [];

function note(type: 'bug' | 'inconsistency' | 'improvement' | 'info', msg: string) {
  findings.push({ type, msg });
  const icon = { bug: '🐛', inconsistency: '⚠️', improvement: '💡', info: 'ℹ️' }[type];
  console.log(`  ${icon} [${type.toUpperCase()}] ${msg}`);
}

async function getTextContent(page: Page, selector: string): Promise<string> {
  try {
    return await page.$eval(selector, el => (el as HTMLElement).textContent?.trim() || '');
  } catch { return ''; }
}

async function getCount(page: Page, selector: string): Promise<number> {
  return (await page.$$(selector)).length;
}

async function screenshotStep(page: Page, name: string) {
  await page.screenshot({ path: `e2e_${name}.png`, fullPage: false });
  console.log(`  📸 e2e_${name}.png`);
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--ignore-certificate-errors'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Capture failed network requests
    const failedRequests: string[] = [];
    page.on('requestfailed', req => {
      failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
    });

    // ============================
    // PHASE 1: LOGIN
    // ============================
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   PHASE 1: LOGIN                     ║');
    console.log('╚══════════════════════════════════════╝');

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
      await inputs[0].type(PUSKESMAS_USERNAME);
      await inputs[1].type(PUSKESMAS_PASSWORD);
    }
    await page.click('button');
    await delay(4000);

    const afterLoginUrl = page.url();
    if (afterLoginUrl.includes('login')) {
      console.log('❌ Login failed, cannot continue');
      return;
    }
    console.log(`  ✅ Logged in as ${PUSKESMAS_USERNAME}, redirected to: ${afterLoginUrl}`);

    // Check: Does puskesmas user land on correct page?
    if (!afterLoginUrl.includes('puskesmas')) {
      note('inconsistency', `Puskesmas user redirected to ${afterLoginUrl} instead of /puskesmas/dashboard`);
    }

    // ============================
    // PHASE 2: NAVIGATE TO LAPORAN
    // ============================
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   PHASE 2: LAPORAN PAGE LOAD         ║');
    console.log('╚══════════════════════════════════════╝');

    await page.goto(`${BASE_URL}/puskesmas/laporan`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(1000);

    // 2a: Check page title / breadcrumb
    const pageTitle = await page.title();
    console.log(`  Page title: "${pageTitle}"`);

    // 2b: Initial state
    const bodyText = await getTextContent(page, 'body');
    const hasEmptyPrompt = bodyText.includes('Pilih bulan dan tahun');
    console.log(`  Empty state prompt: ${hasEmptyPrompt ? '✅' : '❌'}`);

    // 2c: Check filter bar layout
    const filterBar = await page.$('.laporan-filter-bar');
    console.log(`  Filter bar: ${filterBar ? '✅' : '❌'}`);

    // 2d: Check if bulan is pre-selected
    const bulanValue = await page.$eval('.ant-select-selection-item', el => el.textContent || '').catch(() => '');
    if (bulanValue) {
      note('info', `Bulan pre-selected: "${bulanValue}"`);
    } else {
      note('improvement', 'Bulan tidak auto-select ke bulan berjalan. User harus pilih manual setiap kali. Bisa auto-default ke bulan sekarang.');
    }

    await screenshotStep(page, '01_initial');

    // ============================
    // PHASE 3: SELECT FILTER & LOAD DATA
    // ============================
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   PHASE 3: SELECT FILTER & LOAD      ║');
    console.log('╚══════════════════════════════════════╝');

    // Select Maret
    const selects = await page.$$('.ant-select-selector');
    if (selects.length >= 2) {
      await selects[0].click();
      await delay(500);
      const bulanOption = await page.waitForSelector('.ant-select-item[title="Maret"]', { timeout: 3000 }).catch(() => null);
      if (bulanOption) {
        await bulanOption.click();
        console.log('  Selected: Maret');
      }
    }

    // Wait for data load
    await delay(5000);
    await screenshotStep(page, '02_data_loaded');

    // ============================
    // PHASE 4: INSPECT PROGRESS HEADER
    // ============================
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   PHASE 4: PROGRESS HEADER           ║');
    console.log('╚══════════════════════════════════════╝');

    const progressHeader = await page.$('.laporan-progress-header');
    if (!progressHeader) {
      note('bug', 'Progress header tidak muncul setelah data dimuat');
    } else {
      const title = await getTextContent(page, '.progress-title');
      console.log(`  Title: "${title}"`);

      const statCards = await page.$$('.progress-stat-card');
      console.log(`  Stat cards: ${statCards.length}`);

      // Extract stats
      for (let i = 0; i < statCards.length; i++) {
        const label = await statCards[i].$eval('.stat-label', el => el.textContent || '').catch(() => '');
        const value = await statCards[i].$eval('.stat-value', el => el.textContent || '').catch(() => '');
        const unit = await statCards[i].$eval('.stat-unit', el => el.textContent || '').catch(() => '');
        console.log(`    [${i}] ${label}: ${value} (${unit})`);
      }

      // Check progress bar
      const barFill = await page.$eval('.progress-bar-fill', el => {
        const style = (el as HTMLElement).style;
        return style.width;
      }).catch(() => '');
      console.log(`  Progress bar width: ${barFill}`);

      // Check progress bar labels
      const barLabels = await getTextContent(page, '.progress-bar-labels');
      console.log(`  Bar labels: "${barLabels}"`);

      // Consistency checks
      const pengisianText = await page.$eval('.progress-stat-card:nth-child(1) .stat-value', el => el.textContent || '').catch(() => '');
      if (pengisianText.includes('/')) {
        const [filled, total] = pengisianText.split('/').map(Number);
        if (barFill !== `${Math.round((filled / total) * 100)}%`) {
          note('inconsistency', `Pengisian stat "${pengisianText}" tidak match progress bar width "${barFill}"`);
        }
      }
    }

    // ============================
    // PHASE 5: INSPECT GROUP CARDS
    // ============================
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   PHASE 5: GROUP CARDS                ║');
    console.log('╚══════════════════════════════════════╝');

    const groupCards = await page.$$('.laporan-group-card');
    console.log(`  Group cards: ${groupCards.length}`);

    if (groupCards.length === 0) {
      note('bug', 'Tidak ada group card meskipun data sudah dimuat');
    }

    for (let i = 0; i < groupCards.length; i++) {
      const headerText = await groupCards[i].$eval('.group-title', el => el.textContent?.trim() || '').catch(() => '');
      const badgeText = await groupCards[i].$eval('.ant-badge', el => el.textContent?.trim() || '').catch(() => '');
      console.log(`  Group ${i}: "${headerText.substring(0, 60)}" — Badge: ${badgeText}`);

      // Check: does the group have a kode tag?
      const kodeTag = await groupCards[i].$('.group-title .ant-tag').catch(() => null);
      if (!kodeTag) {
        note('info', `Group "${headerText.substring(0, 40)}" tidak punya kode tag`);
      }
    }

    // Check: is "Kegiatan Lainnya" showing? (fallback label = data issue)
    const allGroupTitles = await page.$$eval('.group-title', els => els.map(el => el.textContent || ''));
    if (allGroupTitles.some(t => t.includes('Kegiatan Lainnya'))) {
      note('inconsistency', 'Ada group "Kegiatan Lainnya" — beberapa sub kegiatan tidak punya parent kegiatan di database');
    }

    // ============================
    // PHASE 6: INSPECT INPUT CARDS (detail)
    // ============================
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   PHASE 6: INPUT CARDS DETAIL         ║');
    console.log('╚══════════════════════════════════════╝');

    const inputCards = await page.$$('.laporan-input-card');
    console.log(`  Total input cards: ${inputCards.length}`);

    const statusEmpty = await getCount(page, '.status-empty');
    const statusSaved = await getCount(page, '.status-tersimpan');
    const statusSent = await getCount(page, '.status-terkirim');
    console.log(`  Status → Empty: ${statusEmpty}, Saved: ${statusSaved}, Sent: ${statusSent}`);

    // Inspect first few cards in detail
    const detailCount = Math.min(inputCards.length, 5);
    for (let i = 0; i < detailCount; i++) {
      const card = inputCards[i];
      console.log(`\n  --- Card ${i + 1} ---`);

      // Meta
      const kodeSub = await card.$eval('.ant-tag:first-child', el => el.textContent || '').catch(() => 'N/A');
      const metaTitle = await card.$eval('.meta-title', el => el.textContent || '').catch(() => 'N/A');
      console.log(`    Kode: ${kodeSub} | ${metaTitle.substring(0, 50)}`);

      // Sumber anggaran tag
      const sumberTag = await card.$$eval('.input-card-meta .ant-tag', tags => {
        return tags.length >= 2 ? tags[1].textContent : 'N/A';
      }).catch(() => 'N/A');
      console.log(`    Sumber Anggaran: ${sumberTag}`);

      // Target section values
      const targetRows = await card.$$eval('.target-section .data-row', rows => {
        return rows.map(r => {
          const label = r.querySelector('.data-label')?.textContent || '';
          const value = r.querySelector('.data-value')?.textContent || '';
          return `${label}: ${value}`;
        });
      }).catch(() => []);
      console.log(`    Target: ${targetRows.join(' | ')}`);

      // Realisasi inputs - check if they have values
      const realisasiInputs = await card.$$('.realisasi-section .ant-input-number-input');
      const realisasiValues = [];
      for (const inp of realisasiInputs) {
        const val = await inp.evaluate((el: any) => el.value || '');
        realisasiValues.push(val);
      }
      console.log(`    Realisasi values: [${realisasiValues.join(', ')}]`);

      // Capaian bars
      const capaianTexts = await card.$$eval('.capaian-text', els => els.map(el => el.textContent || ''));
      console.log(`    Capaian: ${capaianTexts.join(', ')}`);

      // Check: target_rp = 0 but angkas = 0 too?
      const targetRpText = targetRows.find(r => r.includes('Anggaran'))?.replace(/[^\d]/g, '') || '0';
      const angkasText = targetRows.find(r => r.includes('Angkas'))?.replace(/[^\d]/g, '') || '0';
      if (targetRpText === '0' && angkasText === '0') {
        note('inconsistency', `Card ${kodeSub}: Target anggaran DAN angkas keduanya 0`);
      }

      // Check: status tag present?
      const statusTag = await card.$('.input-card-meta .ant-tag:last-child');
      const statusText = statusTag ? await statusTag.evaluate(el => el.textContent || '') : '';
      console.log(`    Status: "${statusText}"`);

      // Check: disabled state for terkirim
      if (statusText === 'Terkirim') {
        const isDisabled = await card.$eval('.realisasi-section .ant-input-number-disabled', () => true).catch(() => false);
        if (!isDisabled) {
          note('bug', `Card ${kodeSub}: Status terkirim tapi input tidak disabled`);
        }
      }
    }

    // ============================
    // PHASE 7: TEST INPUT INTERACTION
    // ============================
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   PHASE 7: INPUT INTERACTION          ║');
    console.log('╚══════════════════════════════════════╝');

    // Find first empty card and try inputting data
    const emptyCard = await page.$('.status-empty');
    if (emptyCard) {
      const realisasiInputs = await emptyCard.$$('.realisasi-section .ant-input-number-input');
      console.log(`  Found empty card with ${realisasiInputs.length} input fields`);

      if (realisasiInputs.length >= 3) {
        // Input Realisasi Anggaran
        await realisasiInputs[0].click({ clickCount: 3 });
        await realisasiInputs[0].type('5000000');
        await delay(200);
        console.log('  Typed 5000000 in Realisasi Anggaran');

        // Input Realisasi Kinerja
        await realisasiInputs[1].click({ clickCount: 3 });
        await realisasiInputs[1].type('10');
        await delay(200);
        console.log('  Typed 10 in Realisasi Kinerja');

        // Input Realisasi Fisik
        await realisasiInputs[2].click({ clickCount: 3 });
        await realisasiInputs[2].type('25.5');
        await delay(200);
        console.log('  Typed 25.5 in Realisasi Fisik');

        // Click elsewhere to blur
        await page.click('.laporan-progress-header');
        await delay(500);

        // Check: did capaian bars update?
        const capaianAfter = await emptyCard.$$eval('.capaian-text', els => els.map(el => el.textContent || ''));
        console.log(`  Capaian after input: ${capaianAfter.join(', ')}`);

        // Check: did values stick?
        const valuesAfter = [];
        for (const inp of realisasiInputs) {
          const val = await inp.evaluate((el: any) => el.value || '');
          valuesAfter.push(val);
        }
        console.log(`  Values after input: [${valuesAfter.join(', ')}]`);

        if (valuesAfter[0] === '' || valuesAfter[0] === '0') {
          note('bug', 'Input value tidak tersimpan setelah mengetik');
        }
      }

      await screenshotStep(page, '03_after_input');
    } else {
      console.log('  No empty cards found to test input');
    }

    // ============================
    // PHASE 8: TEST PERMASALAHAN/UPAYA
    // ============================
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   PHASE 8: PERMASALAHAN/UPAYA         ║');
    console.log('╚══════════════════════════════════════╝');

    const extrasToggle = await page.$('.extras-toggle');
    if (extrasToggle) {
      const toggleText = await extrasToggle.evaluate(el => el.textContent || '');
      console.log(`  Toggle text: "${toggleText}"`);

      await extrasToggle.click();
      await delay(300);

      const extrasFields = await page.$$('.extras-fields textarea');
      console.log(`  TextArea fields after expand: ${extrasFields.length}`);

      if (extrasFields.length >= 2) {
        // Type permasalahan
        await extrasFields[0].type('Test permasalahan dari E2E');
        await delay(200);

        // Type upaya
        await extrasFields[1].type('Test upaya dari E2E');
        await delay(200);
        console.log('  Filled permasalahan & upaya');
      }

      // Check label text
      const labels = await page.$$eval('.extras-field label', els => els.map(el => el.textContent || ''));
      console.log(`  Field labels: ${labels.join(', ')}`);
    }

    // ============================
    // PHASE 9: SAVE
    // ============================
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   PHASE 9: SAVE                       ║');
    console.log('╚══════════════════════════════════════╝');

    // Check action bar state before save
    const actionBarInfo = await getTextContent(page, '.action-bar-info');
    console.log(`  Action bar info: "${actionBarInfo}"`);

    const saveBtn = await page.$('.action-bar-buttons button:first-child');
    if (saveBtn) {
      const saveBtnText = await saveBtn.evaluate(el => el.textContent || '');
      const saveBtnDisabled = await saveBtn.evaluate((el: any) => el.disabled);
      console.log(`  Save button: "${saveBtnText}" | Disabled: ${saveBtnDisabled}`);

      if (!saveBtnDisabled) {
        await saveBtn.click();
        console.log('  Clicked save...');
        await delay(4000);

        // Check for success message
        const successMsg = await page.$('.ant-message-success');
        const errorMsg = await page.$('.ant-message-error');
        if (successMsg) {
          const msgText = await successMsg.evaluate(el => el.textContent || '');
          console.log(`  ✅ Save success: "${msgText}"`);
        } else if (errorMsg) {
          const msgText = await errorMsg.evaluate(el => el.textContent || '');
          note('bug', `Save failed: "${msgText}"`);
        } else {
          console.log('  ⚠️ No success/error message detected');
        }

        await screenshotStep(page, '04_after_save');

        // Check: did card status change from empty to tersimpan?
        await delay(1000);
        const emptyAfterSave = await getCount(page, '.status-empty');
        const savedAfterSave = await getCount(page, '.status-tersimpan');
        console.log(`  After save → Empty: ${emptyAfterSave}, Saved: ${savedAfterSave}`);

        if (emptyAfterSave >= statusEmpty) {
          note('info', `Empty count before: ${statusEmpty}, after save: ${emptyAfterSave}`);
        }
      }
    }

    // ============================
    // PHASE 10: SUBMIT CHECK
    // ============================
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   PHASE 10: SUBMIT BUTTON STATE       ║');
    console.log('╚══════════════════════════════════════╝');

    const submitBtn = await page.$('.action-bar-buttons button:nth-child(2)');
    if (submitBtn) {
      const submitText = await submitBtn.evaluate(el => el.textContent || '');
      const submitDisabled = await submitBtn.evaluate((el: any) => el.disabled);
      console.log(`  Submit button: "${submitText}" | Disabled: ${submitDisabled}`);

      if (submitDisabled) {
        console.log('  Submit disabled (expected if not all rows saved)');
      }
    }

    // ============================
    // PHASE 11: RESPONSIVE CHECK
    // ============================
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   PHASE 11: RESPONSIVE (mobile)       ║');
    console.log('╚══════════════════════════════════════╝');

    await page.setViewport({ width: 375, height: 812 }); // iPhone viewport
    await delay(1000);

    // Check if layout adjusts
    const mobileDataGrid = await page.$eval('.input-card-data', el => {
      const style = window.getComputedStyle(el);
      return style.gridTemplateColumns;
    }).catch(() => '');
    console.log(`  Mobile data grid columns: "${mobileDataGrid}"`);

    if (mobileDataGrid.includes('1fr 1fr') || mobileDataGrid.split(' ').filter(v => v !== '0px').length > 1) {
      note('improvement', 'Pada viewport mobile (375px), data grid masih 2 kolom. Target/Realisasi bisa terlalu sempit.');
    } else {
      console.log('  ✅ Mobile layout stacks to single column');
    }

    // Check action bar on mobile
    const mobileActionBar = await page.$eval('.laporan-action-bar', el => {
      const style = window.getComputedStyle(el);
      return style.flexDirection;
    }).catch(() => '');
    console.log(`  Mobile action bar direction: ${mobileActionBar}`);

    // Check stat cards on mobile
    const mobileStatGrid = await page.$eval('.laporan-progress-stats', el => {
      const style = window.getComputedStyle(el);
      return style.gridTemplateColumns;
    }).catch(() => '');
    console.log(`  Mobile stat grid: "${mobileStatGrid}"`);

    await screenshotStep(page, '05_mobile');

    // Restore desktop
    await page.setViewport({ width: 1280, height: 900 });
    await delay(500);

    // ============================
    // PHASE 12: INDIKATOR KINERJA
    // ============================
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   PHASE 12: INDIKATOR KINERJA         ║');
    console.log('╚══════════════════════════════════════╝');

    const infoIcons = await page.$$('.input-card-meta .anticon-info-circle');
    console.log(`  Info icons: ${infoIcons.length}`);

    if (infoIcons.length > 0) {
      await infoIcons[0].click();
      await delay(300);

      const indikatorVisible = await page.$('.input-card-indikator.visible');
      if (indikatorVisible) {
        const indikatorText = await indikatorVisible.evaluate(el => el.textContent || '');
        console.log(`  Indikator: "${indikatorText.substring(0, 80)}"`);

        if (indikatorText.includes('-') && indikatorText.length < 30) {
          note('inconsistency', 'Indikator kinerja hanya berisi "-" — data kosong di database');
        }
      } else {
        note('bug', 'Klik info icon tidak menampilkan indikator kinerja');
      }
    }

    // ============================
    // PHASE 13: CONSOLE ERRORS & NETWORK
    // ============================
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   PHASE 13: CONSOLE & NETWORK ERRORS  ║');
    console.log('╚══════════════════════════════════════╝');

    if (consoleErrors.length > 0) {
      console.log(`  Console errors: ${consoleErrors.length}`);
      for (const err of consoleErrors.slice(0, 10)) {
        note('bug', `Console error: ${err.substring(0, 120)}`);
      }
    } else {
      console.log('  ✅ No console errors');
    }

    if (failedRequests.length > 0) {
      console.log(`  Failed requests: ${failedRequests.length}`);
      for (const req of failedRequests.slice(0, 5)) {
        note('bug', `Failed request: ${req}`);
      }
    } else {
      console.log('  ✅ No failed network requests');
    }

    // ============================
    // PHASE 14: CROSS-CHECK WITH OTHER PAGES
    // ============================
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   PHASE 14: DASHBOARD CROSS-CHECK     ║');
    console.log('╚══════════════════════════════════════╝');

    await page.goto(`${BASE_URL}/puskesmas/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(3000);
    await screenshotStep(page, '06_dashboard');

    const dashboardUrl = page.url();
    console.log(`  Dashboard URL: ${dashboardUrl}`);

    // Check if dashboard loaded
    if (dashboardUrl.includes('dashboard')) {
      console.log('  ✅ Dashboard loaded');
    } else {
      note('bug', `Dashboard redirect issue: ${dashboardUrl}`);
    }

    // ============================
    // PHASE 15: NAVIGATION BETWEEN PAGES
    // ============================
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   PHASE 15: PAGE NAVIGATION           ║');
    console.log('╚══════════════════════════════════════╝');

    // Go back to laporan
    await page.goto(`${BASE_URL}/puskesmas/laporan`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(1000);

    // Check: does it remember the last selected bulan/tahun?
    const rememberedBulan = await page.$eval('.ant-select-selection-item', el => el.textContent || '').catch(() => '');
    console.log(`  Remembered bulan after navigation: "${rememberedBulan}"`);
    if (!rememberedBulan) {
      note('improvement', 'Filter bulan/tahun tidak diingat setelah navigasi ke halaman lain. User harus pilih ulang.');
    }

    // Check sidebar active state
    const activeSidebar = await page.$eval('.ant-menu-item-selected', el => el.textContent || '').catch(() => '');
    console.log(`  Active sidebar: "${activeSidebar}"`);

    // ============================
    // FINAL SUMMARY
    // ============================
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   FINAL SUMMARY                       ║');
    console.log('╚══════════════════════════════════════╝\n');

    const bugs = findings.filter(f => f.type === 'bug');
    const inconsistencies = findings.filter(f => f.type === 'inconsistency');
    const improvements = findings.filter(f => f.type === 'improvement');
    const infos = findings.filter(f => f.type === 'info');

    if (bugs.length > 0) {
      console.log(`\n🐛 BUGS (${bugs.length}):`);
      bugs.forEach((f, i) => console.log(`  ${i + 1}. ${f.msg}`));
    }

    if (inconsistencies.length > 0) {
      console.log(`\n⚠️ INCONSISTENCIES (${inconsistencies.length}):`);
      inconsistencies.forEach((f, i) => console.log(`  ${i + 1}. ${f.msg}`));
    }

    if (improvements.length > 0) {
      console.log(`\n💡 IMPROVEMENTS (${improvements.length}):`);
      improvements.forEach((f, i) => console.log(`  ${i + 1}. ${f.msg}`));
    }

    if (infos.length > 0) {
      console.log(`\n ℹ️ INFO (${infos.length}):`);
      infos.forEach((f, i) => console.log(`  ${i + 1}. ${f.msg}`));
    }

    console.log(`\nTotal findings: ${findings.length} (${bugs.length} bugs, ${inconsistencies.length} inconsistencies, ${improvements.length} improvements)`);

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
}

main();
