import type { Locator, Page } from '@playwright/test';

import { AutocompleteComponent } from '@src/components/autocomplete.component';
import { SelectComponent } from '@src/components/select.component';
import type { UserData } from '@src/data/user.factory';
import { routes } from '@src/pages/routes';

/**
 * Page Object for Admin > User Management > Add User.
 *
 * Verified live:
 *  - form fields: User Role (1st select), Employee Name (autocomplete,
 *    the only one on this page), Status (2nd select), Username (input,
 *    NO placeholder -> label-group locator), Password + Confirm Password
 *    (two password inputs, no placeholders)
 *  - Save navigates BACK to the users list — this flow shows NO toast,
 *    so the page object synchronises on the URL, and specs verify the
 *    outcome through search rather than a toast.
 *
 * No assertions in here.
 */
export class AddUserPage {
  private readonly page: Page;

  private readonly roleSelect: SelectComponent;
  private readonly employeeName: AutocompleteComponent;
  private readonly statusSelect: SelectComponent;
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly confirmPasswordInput: Locator;
  private readonly saveButton: Locator;

  /** Inline validation messages under the fields (appear on submit). */
  readonly fieldErrors: Locator;

  constructor(page: Page) {
    this.page = page;
    this.roleSelect = new SelectComponent(page.locator('.oxd-select-wrapper').first());
    this.employeeName = new AutocompleteComponent(page.locator('.oxd-autocomplete-wrapper'));
    this.statusSelect = new SelectComponent(page.locator('.oxd-select-wrapper').nth(1));
    this.usernameInput = page
      .locator('.oxd-input-group')
      .filter({ hasText: 'Username' })
      .locator('input');
    this.passwordInput = page.locator('input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[type="password"]').nth(1);
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.fieldErrors = page.locator('.oxd-input-field-error-message');
  }

  async goto(): Promise<void> {
    await this.page.goto(routes.adminAddUser, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Fill the whole form without submitting — invalid-submission specs
   * (e.g. duplicate username) must NOT wait for the list navigation.
   *
   * @param user credentials/role/status (from the factory — unique username)
   * @param employeeLastName unique last name of an EXISTING employee; the
   *        autocomplete picks its option by this text
   */
  async fillUser(user: UserData, employeeLastName: string): Promise<void> {
    await this.roleSelect.select(user.role);
    await this.employeeName.select(employeeLastName, employeeLastName);
    await this.statusSelect.select(user.status);
    await this.usernameInput.fill(user.username);
    await this.passwordInput.fill(user.password);
    await this.confirmPasswordInput.fill(user.password);
  }

  /** Click Save. Valid forms navigate to the list; invalid ones stay. */
  async save(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Create a user through the form and land back on the users list.
   */
  async addUser(user: UserData, employeeLastName: string): Promise<void> {
    await this.fillUser(user, employeeLastName);
    await this.save();

    // No toast on this flow — arrival back on the list is the signal.
    await this.page.waitForURL(routes.admin);
  }
}
