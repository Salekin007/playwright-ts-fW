import type { Locator, Page } from '@playwright/test';

import { routes } from '@src/pages/routes';

/** Sidebar menu entries the framework navigates through. */
export type MenuName = 'Admin' | 'PIM' | 'Leave' | 'Dashboard';

/**
 * Where each menu entry lands, used to synchronise navigation.
 * Kept next to the component so adding a menu is a two-line change.
 */
const MENU_ROUTES: Record<MenuName, string> = {
  Admin: routes.admin,
  PIM: routes.pim,
  Leave: routes.leave,
  Dashboard: routes.dashboard,
};

/**
 * Reusable component: the left sidepanel navigation.
 *
 * Takes a Page because the sidebar is a page-level region (it exists on
 * every authenticated screen), not a sub-part of one form or table.
 *
 * Locator strategy (verified live): every menu entry is a real <a> whose
 * accessible name is its label -> getByRole('link', { name, exact: true }).
 * exact matters: "Admin" must not soft-match a hypothetical "Admin Roles".
 *
 * Component contract: locators + actions only, zero assertions.
 */
export class SidebarComponent {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** The menu entry for a module, e.g. menuItem('PIM'). */
  menuItem(menu: MenuName): Locator {
    return this.page.getByRole('link', { name: menu, exact: true });
  }

  /**
   * Click a menu entry and wait until the browser actually arrived at the
   * module route. Waiting on the URL is synchronisation, not assertion:
   * the caller (spec or page object) still verifies the outcome itself.
   */
  async navigateTo(menu: MenuName): Promise<void> {
    await this.menuItem(menu).click();
    await this.page.waitForURL(MENU_ROUTES[menu]);
  }
}
