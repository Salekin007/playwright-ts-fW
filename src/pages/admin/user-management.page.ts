import type { Locator, Page } from '@playwright/test';

import { DataTableComponent } from '@src/components/data-table.component';
import { SelectComponent } from '@src/components/select.component';
import type { UserRole } from '@src/data/user.factory';
import { routes } from '@src/pages/routes';

/**
 * Page Object for Admin > User Management (system users list).
 *
 * COMPOSES the step-4 components: results table = DataTableComponent,
 * the User Role filter = SelectComponent (OrangeHRM's fake select — a
 * div with role=listbox/option semantics, verified live).
 *
 * Verified live facts baked in:
 *  - search form order: Username (input, no placeholder -> label-group
 *    locator), User Role (1st select), Employee Name (autocomplete),
 *    Status (2nd select)
 *  - result count text: "(57) Records Found" — same /Records? Found/
 *    pattern as PIM
 *  - row columns: [checkbox, Username, User Role, Employee Name, Status]
 *  - delete flow: row trash -> .oxd-dialog-container-default ->
 *    "Yes, Delete" -> success toast, rows vanish in place
 *
 * No assertions in here.
 */
export class UserManagementPage {
  private readonly page: Page;

  /** The results table — exposed for spec assertions on rows/counts. */
  readonly table: DataTableComponent;

  private readonly usernameInput: Locator;
  private readonly roleSelect: SelectComponent;
  private readonly statusSelect: SelectComponent;
  private readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = new DataTableComponent(page.locator('.oxd-table'));
    this.usernameInput = page
      .locator('.oxd-input-group')
      .filter({ hasText: 'Username' })
      .locator('input');
    this.roleSelect = new SelectComponent(page.locator('.oxd-select-wrapper').first());
    this.statusSelect = new SelectComponent(page.locator('.oxd-select-wrapper').nth(1));
    this.searchButton = page.getByRole('button', { name: 'Search' });
  }

  /**
   * Open the users list and wait for its INITIAL data load.
   *
   * The page fires GET /api/v2/admin/users on mount; if that request is
   * still in flight, runSearch()'s response wait would synchronise on IT
   * instead of the search's own response — and the table then re-renders
   * mid-assertion (caught live in the role-filter test). Settling the
   * initial load here makes every later response unambiguous.
   */
  async goto(): Promise<void> {
    const initialLoad = this.page.waitForResponse(
      (res) => res.url().includes('/api/v2/admin/users') && res.request().method() === 'GET',
      { timeout: 30000 },
    );
    await this.page.goto(routes.admin, { waitUntil: 'domcontentloaded' });
    // Best-effort settle: on a badly stalled server the initial load can
    // exceed the wait — proceeding is still safe because every search
    // synchronises on its OWN response (urlMustInclude) and assertions
    // poll. The settle only removes a race, it is not a precondition.
    await initialLoad.catch(() => undefined);
  }

  /** Run the search with a username in the filter (exact-match filter). */
  async searchByUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.runSearch('username=');
  }

  /** Set the User Role filter and run the search. */
  async filterByRole(role: UserRole): Promise<void> {
    await this.roleSelect.select(role);
    await this.runSearch();
  }

  /** Set the Status filter and run the search. */
  async filterByStatus(status: string): Promise<void> {
    await this.statusSelect.select(status);
    await this.runSearch();
  }

  /** Delete a user via its row action + confirm dialog. */
  async deleteUser(username: string): Promise<void> {
    await this.table.clickRowAction(username, 'delete');
    await this.page
      .locator('.oxd-dialog-container-default')
      .getByRole('button', { name: 'Yes, Delete' })
      .click();
  }

  /** Number shown in "(N) Records Found". */
  async resultCount(): Promise<number> {
    const text = await this.page
      .getByText(/Records? Found/)
      .first()
      .innerText();
    const match = /\((\d+)\)/.exec(text);
    if (match === null) throw new Error(`Cannot parse record count from "${text}"`);
    return Number(match[1]);
  }

  /**
   * Click Search, synchronised on the users-list API response.
   *
   * @param urlMustInclude extra URL fragment the response must carry
   *        (e.g. "username=") — distinguishes THIS search's request from a
   *        still-in-flight page-load GET, which would otherwise resolve
   *        the wait early and let assertions read pre-search state
   *        (caught live: count read "(7)" then flipped to "(1)").
   */
  private async runSearch(urlMustInclude?: string): Promise<void> {
    await Promise.all([
      this.page.waitForResponse(
        (res) =>
          res.url().includes('/api/v2/admin/users') &&
          res.request().method() === 'GET' &&
          (urlMustInclude === undefined || res.url().includes(urlMustInclude)),
      ),
      this.searchButton.click(),
    ]);
  }
}
