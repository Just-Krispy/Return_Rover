import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /*
   * The API specs hit LIVE free-tier MockAPI, which rate-limits (HTTP 429) under
   * bursts of requests. Retry once-ish so a stray transient 429 auto-heals.
   */
  retries: process.env.CI ? 2 : 1,
  /*
   * Keep parallelism deliberately LOW. The API specs share a single free-tier
   * MockAPI resource, and Playwright's `request` fixture needs no real browser.
   * Running the same shared resource from many workers at once (the old default of
   * 3+ browser projects in parallel) triple-hammers it and races the /filter seed.
   * Serial workers + retries below are what actually keep this green.
   */
  workers: process.env.CI ? 1 : 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    /*
     * Dedicated project for the shared live-API specs (*.api.spec.ts). These
     * specs use only the `request` fixture (they need no browser), so we scope
     * them to THIS single project and run them exactly ONCE instead of once per
     * browser. All three browser projects below ignore *.api.spec.ts so the API
     * suite doesn't redundantly hammer the shared free-tier MockAPI/JSONPlaceholder
     * endpoints in triplicate.
     */
    {
      name: 'api',
      testMatch: /\.api\.spec\.ts/,
      use: {},
    },

    {
      name: 'chromium',
      testIgnore: /\.api\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      testIgnore: /\.api\.spec\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      testIgnore: /\.api\.spec\.ts/,
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});