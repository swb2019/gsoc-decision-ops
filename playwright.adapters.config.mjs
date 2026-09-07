import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  testMatch: 'glasshouse-adapters.spec.mjs',
  timeout: 60_000,
  workers: 1,
  reporter: [['list']],
  outputDir: 'qa-output/adapter-results',
  use: { ...devices['Desktop Chrome'], channel: 'chrome', trace: 'retain-on-failure' },
});
