import { SidebarComponent } from '@src/components/sidebar.component';
import { ToastComponent } from '@src/components/toast.component';

import { test as authTest } from './auth.fixture';

/**
 * App-level fixtures: page-scoped components, pre-bound to the
 * authenticated page, so specs use them without manual wiring.
 *
 * Only Sidebar and Toast are injected here on purpose — they are PAGE-
 * scoped regions (a page has one sidebar, toasts render at page root),
 * so a fixture can bind them for you.
 *
 * DatePicker / Autocomplete / DataTable are REGION-scoped: their
 * constructor takes the Locator of THEIR field/table. A fixture cannot
 * know which of the page's date inputs or tables you mean, so those are
 * composed inside module page objects instead (PIM, Leave, Admin steps).
 * That split — Page in, Locator in — is exactly why components stay
 * reusable rather than becoming page-object clones.
 */
type AppFixtures = {
  /** Left navigation, bound to the authenticated page. */
  sidebar: SidebarComponent;
  /** Toast notifications, bound to the authenticated page. */
  toast: ToastComponent;
};

export const test = authTest.extend<AppFixtures>({
  sidebar: async ({ authenticatedPage }, use) => {
    await use(new SidebarComponent(authenticatedPage));
  },
  toast: async ({ authenticatedPage }, use) => {
    await use(new ToastComponent(authenticatedPage));
  },
});

export { expect } from '@playwright/test';
