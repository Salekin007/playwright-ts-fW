import { defineConfig, devices } from '@playwright/test';

import { config } from './src/config/env';

/**
 * Playwright configuration — the single place that controls HOW tests run.
 * WHAT to verify lives in tests/, HOW to interact lives in src/pages.
 */
export default defineConfig({
  // Where specs live — one folder per application module.
  testDir: './tests',

  // Budget for ONE test. Generous on purpose: the shared demo server has
  // verified dry spells where a single navigation takes 20s+.
  timeout: config.timeouts.test,

  // Tests inside one file run in parallel. Safe here because every test
  // generates its own unique data and never depends on another test.
  fullyParallel: true,

  // `test.only` accidentally committed? Fail the run instead of silently
  // skipping the rest of the suite.
  forbidOnly: config.isCi,

  // 0 retries locally (see real failures fast), 2 on CI (absorb flakiness).
  retries: config.retries,

  // The demo site is shared infrastructure — too many workers would hammer
  // it and slow every run down. Tune via WORKERS in .env.
  workers: config.workers,

  reporter: [
    ['list'], // live progress in the terminal
    ['html', { open: 'never' }], // detailed HTML report -> playwright-report/
    ['allure-playwright', { resultsDir: './allure-results' }], // Allure data
  ],

  // Defaults applied to every test in every project below.
  use: {
    baseURL: config.baseUrl,
    headless: config.headless,
    actionTimeout: config.timeouts.action,
    navigationTimeout: config.timeouts.navigation,

    // Debugging artifacts — recorded cheaply, kept ONLY for failures.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Deterministic rendering of dates/labels across machines.
    locale: 'en-US',
  },

  // Global timeout for expect() assertions (default 5s is tight for this site).
  expect: {
    timeout: config.timeouts.expect,
  },

  // Where Playwright puts artifacts of failed tests.
  outputDir: './test-results',

  projects: [
    // Runs FIRST and ONCE per run: logs in through the UI and saves the
    // session to .auth/admin.json. Cost: a single login for the whole run.
    // Retries are safe here specifically: the step is idempotent (login ->
    // save state) and it is the first thing to hit a cold shared server.
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      retries: config.isCi ? 2 : 1,
    },

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Guarantees .auth/admin.json exists before any test needs it.
      //
      // NOTE: storageState is deliberately NOT set at project level —
      // auth specs must start anonymous. Tests that need a logged-in
      // page opt in via the `authenticatedPage` fixture
      // (tests/fixtures/auth.fixture.ts).
      dependencies: ['setup'],
    },

    // Cross-browser coverage later is one entry each:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
