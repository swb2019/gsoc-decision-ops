import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 60000, workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'qa-output/report', open: 'never' }]],
  outputDir: 'qa-output/results',
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4181', viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure', launchOptions: { args: ['--enable-unsafe-swiftshader'] } },
  webServer: { command: 'node scripts/serve-qa.mjs', url: 'http://127.0.0.1:4181', reuseExistingServer: !process.env.CI },
});
