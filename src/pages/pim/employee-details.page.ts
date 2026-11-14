import type { Locator, Page } from '@playwright/test';

/**
 * Page Object for PIM > Personal Details (an employee's edit page).
 *
 * Verified live: name fields are the same placeholder-labelled inputs as
 * the add form; "Employee Id" is a read-only-ish input inside the group
 * labelled "Employee Id"; the page carries TWO Save buttons (top and
 * bottom of the card) — the first one is the personal-details save.
 *
 * Editing a name and saving fires PUT .../personal-details and shows a
 * "Successfully Updated" success toast (asserted in the spec, not here).
 */
export class EmployeeDetailsPage {
  private readonly page: Page;

  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  private readonly employeeIdInput: Locator;
  private readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.employeeIdInput = page
      .locator('.oxd-input-group')
      .filter({ hasText: 'Employee Id' })
      .locator('input');
    this.saveButton = page.getByRole('button', { name: 'Save' }).first();
  }

  /**
   * Wait until the personal-details form is truly ready for input.
   *
   * Two conditions, both verified the hard way on a slow server:
   *  1. the form-loading overlay is gone (it intercepts clicks), and
   *  2. the inputs hold their SERVER values — the form mounts EMPTY and
   *     Vue fills it when the personal-details GET lands. Typing before
   *     that bind gets silently overwritten by it, so the edit "succeeds"
   *     while saving the old value.
   */
  private async waitForFormReady(): Promise<void> {
    await this.page.locator('.oxd-form-loader').waitFor({ state: 'hidden' });
    // String form on purpose: this expression runs IN THE BROWSER, and the
    // project's tsconfig (a Node project) has no DOM types for a function
    // form to draw on.
    await this.page.waitForFunction(
      `document.querySelector('input[placeholder="First Name"]')?.value !== ''`,
    );
  }

  /**
   * Persist current form values (fires the personal-details PUT).
   * Waits for the loading overlay first — URL arrival != form interactive.
   */
  async save(): Promise<void> {
    await this.page.locator('.oxd-form-loader').waitFor({ state: 'hidden' });
    await this.saveButton.click();
  }

  /** Change the first name and save in one step. */
  async updateFirstName(value: string): Promise<void> {
    await this.waitForFormReady();
    await this.firstNameInput.fill(value);
    await this.save();
  }

  /** Current value of the generated employee id input (e.g. "0372"). */
  async readEmployeeId(): Promise<string> {
    return this.employeeIdInput.inputValue();
  }

  /** Current first-name input value. */
  async readFirstName(): Promise<string> {
    return this.firstNameInput.inputValue();
  }
}
