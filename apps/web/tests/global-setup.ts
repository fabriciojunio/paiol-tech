import { chromium, type FullConfig } from '@playwright/test';
import { mkdirSync } from 'fs';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:3000';
  const apiURL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api';

  mkdirSync('tests/.auth', { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  // Call the E2E-only endpoint that creates a test session and sets the refresh cookie
  const apiResponse = await page.request.post(`${apiURL}/auth/e2e-token`);
  if (!apiResponse.ok()) {
    console.warn('[global-setup] e2e-token endpoint returned', apiResponse.status(), '— auth state may be empty');
    await browser.close();
    return;
  }

  // Save the full browser storage state (includes the paiol_refresh cookie)
  await context.storageState({ path: 'tests/.auth/user.json' });
  await browser.close();
}

export default globalSetup;
