import { expect, test } from '@src/fixtures/app.fixture';
import { DashboardPage } from '@src/pages/dashboard.page';
import { routes } from '@src/pages/routes';

/**
 * Dashboard — widget presence and Quick Launch navigation.
 *
 * All names below are live-verified (widget headings and the icon-only
 * buttons' title attributes). Widget content loads async behind a
 * spinner; web-first assertions wait through it.
 */
const WIDGET_NAMES = [
  'Time at Work',
  'My Actions',
  'Quick Launch',
  'Buzz Latest Posts',
  'Employees on Leave Today',
  'Employee Distribution by Sub Unit',
  'Employee Distribution by Location',
] as const;

test.describe('Dashboard @smoke', () => {
  test('shows all core widgets', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();

    for (const name of WIDGET_NAMES) {
      await expect(dashboard.widget(name)).toBeVisible();
    }
  });

  test('quick launch navigates to leave assignment', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();

    await dashboard.quickLaunchButton('Assign Leave').click();
    await expect(authenticatedPage).toHaveURL(routes.leaveApply);
  });
});
