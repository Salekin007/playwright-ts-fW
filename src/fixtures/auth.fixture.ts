import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

import { AUTH_STATE_PATH } from '@src/config/constants';

/**
 * Custom fixtures for authenticated tests.
 *
 * Why a FIXTURE instead of `storageState` on the project in
 * playwright.config.ts: project-level storageState makes EVERY test in
 * the project logged-in — including specs that must start anonymous
 * (login, logout, invalid-credentials). A fixture lets each test opt in.
 *
 * How it works: the setup project (tests/auth/auth.setup.ts) logs in once
 * per run and saves cookies + localStorage to .auth/admin.json. Here we
 * create a NEW browser context seeded with that state, so the test starts
 * already authenticated — no login screen, no wasted seconds per test.
 *
 * The context is created per test and closed afterwards, so tests stay
 * isolated (cookies mutated by one test never leak into another).
 *
 * Lives in src/fixtures (not tests/) because it is framework
 * infrastructure reused by every module's specs.
 */
type AuthFixtures = {
  /** A page whose context was seeded with the admin storageState. */
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
    const authenticatedPage = await context.newPage();
    await use(authenticatedPage);
    await context.close();
  },
});

export { expect } from '@playwright/test';
