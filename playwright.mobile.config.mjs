import { defineConfig } from '@playwright/test';
import base from './playwright.config.mjs';
export default defineConfig({
  ...base,
  testMatch: ['**/mobile-layout.spec.mjs', '**/voice-autosend.spec.mjs'],
  reporter: [['list'], ['html', { outputFolder: 'qa-output/mobile-report', open: 'never' }]],
  outputDir: 'qa-output/mobile-results',
  use: {
    ...base.use,
    baseURL: 'http://127.0.0.1:4182',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  },
  webServer: {
    ...base.webServer,
    env: { HOURGLASS_QA_PORT: '4182' },
    url: 'http://127.0.0.1:4182',
  },
});
