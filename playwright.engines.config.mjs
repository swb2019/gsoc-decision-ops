import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config.mjs';

// Additional local engines supplement physical-device tests. WebKit is not iPhone/Safari certification.
export default defineConfig({
  ...base,
  timeout: 120000, // The local WebKit port executes the legacy five-minute virtual-clock setup slowly.
  testIgnore: ['**/glasshouse-resilience.spec.mjs'], // Chrome DevTools GPU/heap injection has its own Chromium suite.
  reporter: [['list'], ['html', { outputFolder: 'qa-output/engine-report', open: 'never' }]],
  outputDir: 'qa-output/engine-results',
  use: { ...base.use, baseURL: 'http://127.0.0.1:4183', channel: undefined, launchOptions: {} },
  webServer: {
    command: 'node scripts/serve-qa.mjs',
    env: { HOURGLASS_QA_PORT: '4183' },
    url: 'http://127.0.0.1:4183',
    reuseExistingServer: false,
  },
  projects: [
    { name: 'webkit', use: { ...devices['Desktop Safari'], browserName: 'webkit' } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], browserName: 'firefox' } },
  ],
});
