import type { Locator, Page } from '@playwright/test';

import { routes } from './routes';

/**
 * Page Object for the post-login application shell (the Dashboard).
 *
 * Kept intentionally minimal for the auth module: all it knows is how to
 * recognise a logged-in session (the user menu in the top bar) and how to
 * log out. Module-specific content (widgets, charts) gets its own page
 * objects in later steps.
 *
 * Locator note (verified on the live DOM): the avatar/name control that
 * opens the user menu is a <span> with NO role and NO accessible name —
 * there is no semantic handle to target, so we fall back to OrangeHRM's
 * own stable class. The menu items it opens ARE semantic
 * (<li role="menuitem">), so logout uses getByRole.
 */
export class DashboardPage {
  private readonly page: Page;

  /** Avatar + name control in the top bar — only exists when logged in. */
  readonly userMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userMenu = page.locator('.oxd-userdropdown-tab');
  }

  /**
   * One dashboard widget card by its heading text (verified live names:
   * "Time at Work", "My Actions", "Quick Launch", "Buzz Latest Posts",
   * "Employees on Leave Today", "Employee Distribution by Sub Unit",
   * "Employee Distribution by Location").
   *
   * Scoped by the OUTER card (.oxd-grid-item) on purpose: the
   * orangehrm-dashboard-widget class sits on BOTH the outer card and an
   * inner sheet, so filtering on it alone matches two nested elements
   * and trips strict mode (caught live).
   * Widget bodies load async behind a spinner — assertions auto-wait.
   */
  widget(name: string): Locator {
    return this.page.locator('.oxd-grid-item.orangehrm-dashboard-widget').filter({ hasText: name });
  }

  /**
   * A Quick Launch button by its title attribute (verified live titles:
   * "Assign Leave", "Leave List", "Timesheets", "Apply Leave", "My
   * Leave", "My Timesheet"). The buttons are icon-only — the title
   * attribute is their sole accessible label.
   */
  quickLaunchButton(title: string): Locator {
    return this.widget('Quick Launch').locator(`button[title="${title}"]`);
  }

  /** Open the dashboard directly (only meaningful with a valid session). */
  async goto(): Promise<void> {
    // 'domcontentloaded' — same rationale as LoginPage.goto(): the 'load'
    // event is needlessly slow on this site and interactions auto-wait.
    await this.page.goto(routes.dashboard, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Log out via the user menu. Two steps: open the dropdown, pick Logout.
   * The app then redirects to the login page (asserted by the spec).
   */
  async logout(): Promise<void> {
    await this.userMenu.click();
    await this.page.getByRole('menuitem', { name: 'Logout' }).click();
  }
}
