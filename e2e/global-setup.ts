import { chromium } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

import { setupAuth } from './fixtures/auth.fixture';

export default async function globalSetup() {
  const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
  await setupAuth(browser);
  await browser.close();
}
