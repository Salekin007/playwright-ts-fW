import type { Locator } from '@playwright/test';

/** Row action buttons present in table rows (verified on Admin user list). */
export type RowAction = 'edit' | 'delete';

/**
 * Icon selector for each action. Verified live: action buttons are
 * icon-only <button>s with NO accessible name (aria-label absent), so a
 * semantic locator is impossible — the icon class is the stable handle.
 */
const ACTION_ICONS: Record<RowAction, string> = {
  edit: '.bi-pencil-fill',
  delete: '.bi-trash',
};

/**
 * Reusable component: OrangeHRM's list-page data table.
 *
 * Takes a LOCATOR, not a Page: tables are region-scoped — the page object
 * of each module passes its own table region (".oxd-table"). Verified
 * live: the container has role="table"; the header row lives outside
 * ".oxd-table-body", so scoping to the body excludes it from row counts;
 * rows expose role="row" and cells role="cell" -> semantic locators.
 *
 * Row matching is substring-by-text across the WHOLE row (verified:
 * "Admin" matched two rows — username "Admin" and an Admin-role user).
 * Prefer a value unique to one column (username, employee id, ...).
 *
 * Component contract: locators + actions only, zero assertions.
 */
export class DataTableComponent {
  private readonly root: Locator;

  /** @param root the ".oxd-table" container of one list page. */
  constructor(root: Locator) {
    this.root = root;
  }

  /** The table body region (excludes the header row). */
  get body(): Locator {
    return this.root.locator('.oxd-table-body');
  }

  /** Data rows of the table (role=row, header excluded). */
  rows(): Locator {
    return this.body.getByRole('row');
  }

  /** Number of data rows right now (0 for an empty/filtered table). */
  async rowCount(): Promise<number> {
    return this.rows().count();
  }

  /** The first row whose text contains the given value/pattern. */
  row(text: string | RegExp): Locator {
    return this.rows().filter({ hasText: text }).first();
  }

  /** Click an action icon (edit/delete) inside a row found by its text. */
  async clickRowAction(rowText: string | RegExp, action: RowAction): Promise<void> {
    await this.row(rowText).locator(ACTION_ICONS[action]).click();
  }
}
