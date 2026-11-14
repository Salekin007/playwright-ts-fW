import { expect, test } from '@src/fixtures/auth.fixture';
import { DashboardPage } from '@src/pages/dashboard.page';
import { routes } from '@src/pages/routes';

/**
 * Session-reuse specs — prove the storageState strategy works.
 *
 * The setup project logged in once and saved the session; the
 * `authenticatedPage` fixture seeds a context with it. Navigating
 * straight to the dashboard only works if that session is accepted —
 * an anonymous or expired session would be redirected to /auth/login.
 */
test.describe('Session reuse via storageState', () => {
  test('authenticated page reaches the dashboard without a UI login @smoke', async ({
    authenticatedPage,
  }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.goto();

    // Landing on /dashboard proves the reused session was accepted.
    await expect(authenticatedPage).toHaveURL(routes.dashboard);
    await expect(dashboardPage.userMenu).toBeVisible();

    // No login screen anywhere — we were never bounced to /auth/login.
    await expect(authenticatedPage.getByRole('button', { name: 'Login' })).toHaveCount(0);
  });
});
