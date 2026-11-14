import type { Locator, Page } from '@playwright/test';

import { AutocompleteComponent } from '@src/components/autocomplete.component';
import { DataTableComponent } from '@src/components/data-table.component';
import { routes } from '@src/pages/routes';

/**
 * Page Object for Leave > Leave List.
 *
 * Verified live: the search form has From/To date inputs, status/type/
 * sub-unit selects and an Employee Name autocomplete; results render in
 * the standard table. The list-fetch call is NOT under /api/ (traffic
 * capture showed no /api/ GET when searching), so this page deliberately
 * does NOT synchronise on a response — spec assertions are web-first and
 * poll until the rows match.
 *
 * Row actions here are a kebab menu (bi-three-dots-vertical) with items
 * like "Cancel Leave" — different from Admin/PIM's pencil/trash buttons.
 *
 * No assertions in here.
 */
export class LeaveListPage {
  private readonly page: Page;

  /** The results table — exposed for spec assertions on rows. */
  readonly table: DataTableComponent;

  private readonly employeeNameFilter: AutocompleteComponent;
  private readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = new DataTableComponent(page.locator('.oxd-table'));
    this.employeeNameFilter = new AutocompleteComponent(
      page.locator('.oxd-autocomplete-wrapper').first(),
    );
    this.searchButton = page.getByRole('button', { name: 'Search' });
  }

  async goto(): Promise<void> {
    await this.page.goto(routes.leave, { waitUntil: 'domcontentloaded' });
  }

  /** Filter by employee (autocomplete pick, then Search). */
  async searchByEmployee(employeeLastName: string): Promise<void> {
    await this.employeeNameFilter.select(employeeLastName, employeeLastName);
    await this.searchButton.click();
  }
}
