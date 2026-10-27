import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against a built frontend (vite preview) talking to a backend
// whose database was filled by backend/tests/fixtures/seedDemoData.js. They change
// that data (an enrolment, a Join Us application), so reseed before each run.
const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:4174';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  // One worker: the specs share the seeded database.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL,
    navigationTimeout: 45_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Locally the installed Google Chrome is used; CI installs Playwright's Chromium.
    ...(process.env.CI ? {} : { channel: 'chrome' }),
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      testIgnore: /responsive\.spec/,
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testMatch: /responsive\.spec/,
    },
  ],
});
