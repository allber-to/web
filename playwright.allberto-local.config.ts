import { defineConfig } from '@playwright/test';
/** Intentionally independent of upstream config, account setup, and .env files. */
export default defineConfig({
  testDir: './tests/local',
  testMatch: 'allberto*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/local/artifacts/report', open: 'never' }],
  ],
  outputDir: 'tests/local/artifacts/results',
  use: {
    baseURL: 'http://127.0.0.1:4178',
    browserName: 'chromium',
    channel: 'chrome',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'en-US',
    timezoneId: 'UTC',
    contextOptions: { reducedMotion: 'reduce' },
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'npx vite --config tests/local/vite.config.ts',
    url: 'http://127.0.0.1:4178/tests/local/index.html',
    reuseExistingServer: false,
    timeout: 120000,
  },
});
