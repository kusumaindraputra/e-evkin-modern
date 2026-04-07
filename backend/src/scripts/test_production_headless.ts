/**
 * Headless browser test for production
 * Tests: Login, admin upload modal (bulan/tanggal penetapan), puskesmas dashboard
 * Usage: npx tsx src/scripts/test_production_headless.ts
 */
import puppeteer from 'puppeteer';

const BASE_URL = 'http://192.168.102.123';
const ADMIN_USERNAME = 'dinkes';
const ADMIN_PASSWORD = 'dinkes123';
const PUSKESMAS_USERNAME = 'leuwiliang';
const PUSKESMAS_PASSWORD = 'bogorkab';

async function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });

  try {
    // ============== TEST 1: Admin Login & Upload Modal ==============
    console.log('\n=== TEST 1: Admin Login & Upload Modal ===');
    const adminPage = await browser.newPage();
    await adminPage.setViewport({ width: 1280, height: 800 });

    await adminPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✅ Login page loaded');

    // Login as admin - get all inputs
    const inputs = await adminPage.$$('input');
    console.log(`Found ${inputs.length} input fields`);
    if (inputs.length >= 2) {
      await inputs[0].type(ADMIN_USERNAME);
      await inputs[1].type(ADMIN_PASSWORD);
    }
    await adminPage.click('button');
    await delay(4000);

    const adminUrl = adminPage.url();
    console.log(`After login URL: ${adminUrl}`);
    if (adminUrl.includes('login')) {
      console.log('❌ Admin login failed - still on login page');
    } else {
      console.log('✅ Admin login successful');
    }

    // Navigate to target upload page
    await adminPage.goto(`${BASE_URL}/admin/target-upload`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);
    console.log(`Target upload page URL: ${adminPage.url()}`);

    // Look for upload button and click it
    const uploadBtn = await adminPage.$('button');
    const buttons = await adminPage.$$('button');
    let uploadClicked = false;
    for (const btn of buttons) {
      const text = await adminPage.evaluate(el => el.textContent, btn);
      if (text && (text.includes('Upload') || text.includes('upload'))) {
        await btn.click();
        uploadClicked = true;
        console.log(`✅ Clicked upload button: "${text}"`);
        break;
      }
    }

    if (!uploadClicked) {
      // Try finding by specific selectors
      console.log('Looking for upload buttons...');
      const allBtns = await adminPage.$$eval('button', btns => btns.map(b => b.textContent?.trim()));
      console.log('Available buttons:', allBtns);
    }

    await delay(2000);

    // Check modal contents
    const modalContent = await adminPage.evaluate(() => {
      const modal = document.querySelector('.ant-modal-body');
      return modal ? modal.innerHTML : 'NO MODAL FOUND';
    });
    console.log(`Modal HTML length: ${modalContent.length}`);
    // Show first 800 chars to debug
    console.log(`Modal HTML preview: ${modalContent.substring(0, 800)}`);

    // Check for bulan_penetapan select in modal
    const bulanSelect = await adminPage.$('.ant-modal select, .ant-modal-body select');
    if (bulanSelect) {
      const options = await adminPage.$$eval('.ant-modal select option', opts => opts.map(o => o.textContent));
      console.log(`✅ Bulan Penetapan select found with options: ${options.join(', ')}`);
    } else {
      // Check all selects on page
      const allSelects = await adminPage.$$('select');
      console.log(`❌ Bulan Penetapan select not in modal (${allSelects.length} selects on page)`);
    }

    // Check for tanggal_penetapan date input
    const dateInput = await adminPage.$('.ant-modal input[type="date"], .ant-modal-body input[type="date"]');
    if (dateInput) {
      const value = await adminPage.evaluate(el => (el as HTMLInputElement).value, dateInput);
      console.log(`✅ Tanggal Penetapan date picker found, default value: ${value}`);
    } else {
      const allDateInputs = await adminPage.$$('input[type="date"]');
      console.log(`❌ Tanggal Penetapan date picker not in modal (${allDateInputs.length} date inputs on page)`);
    }

    // Check for catatan input
    const catatanInput = await adminPage.$('input[placeholder*="Contoh"]');
    if (catatanInput) {
      console.log('✅ Catatan input found');
    }

    // Take screenshot
    await adminPage.screenshot({ path: 'test_admin_upload_modal.png', fullPage: false });
    console.log('📸 Screenshot saved: test_admin_upload_modal.png');

    await adminPage.close();

    // ============== TEST 2: Puskesmas Login & Dashboard ==============
    console.log('\n=== TEST 2: Puskesmas Login & Dashboard ===');
    const puskPage = await browser.newPage();
    await puskPage.setViewport({ width: 1280, height: 800 });

    await puskPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Login as puskesmas
    const pInputs = await puskPage.$$('input');
    if (pInputs.length >= 2) {
      await pInputs[0].type(PUSKESMAS_USERNAME);
      await pInputs[1].type(PUSKESMAS_PASSWORD);
    }
    await puskPage.click('button');
    await delay(4000);

    const puskUrl = puskPage.url();
    console.log(`After login URL: ${puskUrl}`);
    if (puskUrl.includes('login')) {
      console.log('❌ Puskesmas login failed - still on login page');
    } else {
      console.log('✅ Puskesmas login successful');
    }

    // Check sidebar nav items
    const sidebarItems = await puskPage.$$eval('.ant-menu-item', items => items.map(i => i.textContent?.trim()));
    console.log(`Sidebar items: ${JSON.stringify(sidebarItems)}`);

    // Navigate to puskesmas dashboard
    await puskPage.goto(`${BASE_URL}/puskesmas/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(4000);
    console.log(`Puskesmas dashboard URL: ${puskPage.url()}`);

    // Check for chart data
    const chartCanvas = await puskPage.$('canvas');
    if (chartCanvas) {
      console.log('✅ Chart canvas found on puskesmas dashboard');
    } else {
      console.log('❌ No chart canvas on puskesmas dashboard');
    }

    // Check for stats cards (Target Anggaran, Realisasi, etc.)
    const pageText = await puskPage.evaluate(() => document.body.innerText);
    const checkTexts = ['Target Anggaran', 'Realisasi', 'Anggaran', 'Dashboard'];
    for (const t of checkTexts) {
      if (pageText.includes(t)) {
        console.log(`✅ Found text: "${t}"`);
      } else {
        console.log(`❌ Missing text: "${t}"`);
      }
    }

    // Check for any numbers (budget values)
    const hasNumbers = /Rp[\s.]*[\d.,]+/.test(pageText) || /\d{1,3}(\.\d{3})+/.test(pageText);
    if (hasNumbers) {
      console.log('✅ Budget numbers found on dashboard');
    } else {
      console.log('⚠️ No budget numbers visible on dashboard');
    }

    // Check console errors
    const consoleErrors: string[] = [];
    puskPage.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Take screenshot
    await puskPage.screenshot({ path: 'test_puskesmas_dashboard.png', fullPage: true });
    console.log('📸 Screenshot saved: test_puskesmas_dashboard.png');

    if (consoleErrors.length > 0) {
      console.log('\n⚠️ Console errors:');
      consoleErrors.forEach(e => console.log(`  ${e}`));
    }

    // Check API responses directly
    console.log('\n=== TEST 3: Direct API Check ===');
    const cookies = await puskPage.cookies();
    const token = await puskPage.evaluate(() => localStorage.getItem('token') || localStorage.getItem('auth-storage'));

    // Make API call to chart-data endpoint
    const chartResponse = await puskPage.evaluate(async () => {
      const stored = localStorage.getItem('auth-storage');
      let tok = '';
      if (stored) {
        try { tok = JSON.parse(stored).state?.token || ''; } catch(e) {}
      }
      try {
        const res = await fetch('/api/puskesmas/dashboard/chart-data?tahun=2026', {
          headers: { 'Authorization': `Bearer ${tok}` }
        });
        const data = await res.json();
        return { status: res.status, data: JSON.stringify(data).substring(0, 500) };
      } catch(e: any) {
        return { status: 0, data: e.message };
      }
    });
    console.log(`Chart API response (status ${chartResponse.status}): ${chartResponse.data}`);

    // Check budget-ytd
    const ytdResponse = await puskPage.evaluate(async () => {
      const stored = localStorage.getItem('auth-storage');
      let tok = '';
      if (stored) {
        try { tok = JSON.parse(stored).state?.token || ''; } catch(e) {}
      }
      try {
        const res = await fetch('/api/puskesmas/dashboard/budget-ytd?tahun=2026', {
          headers: { 'Authorization': `Bearer ${tok}` }
        });
        const data = await res.json();
        return { status: res.status, data: JSON.stringify(data).substring(0, 500) };
      } catch(e: any) {
        return { status: 0, data: e.message };
      }
    });
    console.log(`Budget YTD API (status ${ytdResponse.status}): ${ytdResponse.data}`);

    await puskPage.close();

    console.log('\n=== TESTS COMPLETE ===');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

main();
