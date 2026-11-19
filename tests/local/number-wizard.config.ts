import { defineConfig } from '@playwright/test';
import base from '../../playwright.allberto-local.config';

export default defineConfig({
  ...base,
  testDir: import.meta.dirname,
  testMatch: 'allberto-number-wizard.spec.ts',
  reporter: 'list',
  outputDir: `${import.meta.dirname}/artifacts/number-wizard`,
  webServer: {
    command: 'npx vite --config tests/local/vite.config.ts',
    cwd: `${import.meta.dirname}/../..`,
    url: 'http://127.0.0.1:4178/tests/local/index.html',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
