import type { Locator, Page } from '@playwright/test';

import { AutocompleteComponent } from '@src/components/autocomplete.component';
import { DataTableComponent } from '@src/components/data-table.component';
import { routes } from '@src/pages/routes';

/**
 * Page Object for PIM > Employee List.
 *
 * COMPOSES the reusable components instead of re-implementing them:
 *  - the results table is a DataTableComponent (row lookup, actions, count)
 *  - the Employee Name filter is an AutocompleteComponent — a typed name
 *    only counts once an option has been PICKED (verified live: filling
 *    without selecting silently searches unfiltered, "(114) Records Found")
 *
 * The search form has two autocomplete fields (Employee Name, Supervisor
 * Name); Employee Name is first in the DOM, hence .first() on the wrapper.
 *
 * Verified live: result-count text singularises ("(1) Record Found") and
 * goes STALE after an in-place delete — specs assert on rows, not on it.
 * No assertions live here.
 */
export class EmployeeListPage {
  private readonly page: Page;

  /** The results table — exposed for spec assertions on rows/counts. */
  readonly table: DataTableComponent;

  private readonly nameFilter: AutocompleteComponent;
  private readonly employeeIdInput: Locator;
  private readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = new DataTableComponent(page.locator('.oxd-table'));
    this.nameFilter = new AutocompleteComponent(page.locator('.oxd-autocomplete-wrapper').first());
    this.employeeIdInput = page
      .locator('.oxd-input-group')
      .filter({ hasText: 'Employee Id' })
      .locator('input');
    this.searchButton = page.getByRole('button', { name: 'Search' });
  }

  /**
   * Open the employee list and wait for its INITIAL data load — same
   * rationale as UserManagementPage.goto(): keeps every later
   * search-response wait unambiguous.
   */
  async goto(): Promise<void> {
    const initialLoad = this.page.waitForResponse(
      (res) => res.url().includes('/api/v2/pim/employees') && res.request().method() === 'GET',
      { timeout: 30000 },
    );
    await this.page.goto(routes.pim, { waitUntil: 'domcontentloaded' });
    // Best-effort settle — same rationale as UserManagementPage.goto().
    await initialLoad.catch(() => undefined);
  }

  /**
   * Filter by employee name and run the search.
   *
   * The Employee Name field must be committed via option pick (see class
   * docs); the click is paired with a waitForResponse on the employees
   * list endpoint so the method returns once results are loading — the
   * spec's web-first assertions handle the rest.
   */
  async searchByName(lastName: string): Promise<void> {
    await this.nameFilter.select(lastName, lastName);
    await Promise.all([
      this.page.waitForResponse(
        (res) => res.url().includes('/api/v2/pim/employees') && res.request().method() === 'GET',
      ),
      this.searchButton.click(),
    ]);
  }

  /** Filter by the generated employee id (e.g. "0372") and search. */
  async searchById(employeeId: string): Promise<void> {
    await this.employeeIdInput.fill(employeeId);
    await Promise.all([
      this.page.waitForResponse(
        (res) => res.url().includes('/api/v2/pim/employees') && res.request().method() === 'GET',
      ),
      this.searchButton.click(),
    ]);
  }

  /** Open a found employee's personal details via the row's edit action. */
  async openEmployee(lastName: string): Promise<void> {
    await this.table.clickRowAction(lastName, 'edit');
    await this.page.waitForURL(/viewPersonalDetails\/empNumber\/\d+/);
  }

  /**
   * Delete a found employee via the row action and confirm the dialog
   * (real dialog class verified live: .oxd-dialog-container-default,
   * confirm button "Yes, Delete").
   */
  async deleteEmployee(lastName: string): Promise<void> {
    await this.table.clickRowAction(lastName, 'delete');
    await this.page
      .locator('.oxd-dialog-container-default')
      .getByRole('button', { name: 'Yes, Delete' })
      .click();
  }

  /**
   * Number shown in "(N) Records Found". Reliable after a SEARCH; stale
   * after in-place deletes (verified) — prefer table.rowCount() there.
   */
  async resultCount(): Promise<number> {
    const text = await this.page
      .getByText(/Records? Found/)
      .first()
      .innerText();
    const match = /\((\d+)\)/.exec(text);
    if (match === null) throw new Error(`Cannot parse record count from "${text}"`);
    return Number(match[1]);
  }
}
