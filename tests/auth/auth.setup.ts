import { mkdirSync } from 'node:fs';

import { test as setup } from '@playwright/test';
import { expect } from '@playwright/test';

import { AUTH_DIR, AUTH_STATE_PATH } from '@src/config/constants';
import { config } from '@src/config/env';
import { DashboardPage } from '@src/pages/dashboard.page';
import { LoginPage } from '@src/pages/login.page';

/**
 * Global auth setup — runs ONCE per test run, before the chromium project
 * (wired via `dependencies` in playwright.config.ts).
 *
 * Logs in through the real UI and persists the session (cookies +
 * localStorage) to .auth/admin.json. Every test that needs an
 * authenticated page then reuses that state through the `authenticatedPage`
 * fixture — one login per run instead of one login per test.
 *
 * The login here doubles as a free login smoke test: if this fails,
 * nothing else runs, and the report points at authentication first.
 */
setup('authenticate as admin', async ({ page }) => {
  // storageState will not create intermediate directories itself.
  mkdirSync(AUTH_DIR, { recursive: true });

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(config.credentials.username, config.credentials.password);

  // Assert BEFORE saving: never persist a half-authenticated session.
  // (Assertions are fine here — this is a spec, not a page object.)
  const dashboardPage = new DashboardPage(page);
  await expect(dashboardPage.userMenu).toBeVisible();

  await page.context().storageState({ path: AUTH_STATE_PATH });
});
