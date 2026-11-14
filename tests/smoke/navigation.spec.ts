import type { MenuName } from '@src/components/sidebar.component';
import { expect, test } from '@src/fixtures/app.fixture';
import { routes } from '@src/pages/routes';

/**
 * Navigation smoke suite — one cheap pass over every module entry.
 *
 * Uses the `sidebar` fixture (bound to `authenticatedPage`) to prove the
 * session-reuse + component wiring end to end: shared login, component
 * navigation, arrival at the right route. If any of these fail, a full
 * regression run is probably wasted time — this is the fast tripwire.
 *
 * Expected route per menu entry, from the single routes source.
 */
const EXPECTED_ROUTE: Record<MenuName, string> = {
  Admin: routes.admin,
  PIM: routes.pim,
  Leave: routes.leave,
  Dashboard: routes.dashboard,
};

test.describe('Module navigation @smoke', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Start from a known authenticated page so the sidebar is present.
    await authenticatedPage.goto(routes.dashboard, { waitUntil: 'domcontentloaded' });
  });

  for (const menu of ['Admin', 'PIM', 'Leave', 'Dashboard'] as const) {
    test(`sidebar navigates to ${menu}`, async ({ sidebar, authenticatedPage }) => {
      await sidebar.navigateTo(menu);

      // The component already synchronised on the URL; the spec verifies it.
      await expect(authenticatedPage).toHaveURL(EXPECTED_ROUTE[menu]);
    });
  }
});
