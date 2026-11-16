import type { Locator, Page } from '@playwright/test';

import type { EmployeeData } from '@src/data/employee.factory';
import { routes } from '@src/pages/routes';

/**
 * Page Object for PIM > Add Employee.
 *
 * Locators verified live: the name fields are placeholder-labelled inputs
 * ("First Name" / "Middle Name" / "Last Name"); Save navigates to
 * /pim/viewPersonalDetails/empNumber/{id} — the employee's numeric id is
 * parsed from that URL (the most reliable source: the API response of the
 * UI flow exposes empNumber there directly).
 *
 * fillForm/save are split so invalid-submission specs can exercise the
 * form WITHOUT the navigation wait the happy path needs.
 *
 * No assertions here — add() returns the id, the spec decides what to check.
 */
export class AddEmployeePage {
  private readonly page: Page;

  /** Inline validation messages under the fields (appear on submit). */
  readonly fieldErrors: Locator;

  /** The optional Employee Id input (custom id, max 10 chars — verified). */
  readonly employeeIdInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fieldErrors = page.locator('.oxd-input-field-error-message');
    this.employeeIdInput = page
      .locator('.oxd-input-group')
      .filter({ hasText: 'Employee Id' })
      .locator('input');
  }

  async goto(): Promise<void> {
    await this.page.goto(routes.pimAddEmployee, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Fill the form without submitting. Optional fields (middle name,
   * employee id) are only filled when set — filling "" would dirty the
   * form without changing its state.
   */
  async fillForm(employee: EmployeeData): Promise<void> {
    await this.page.getByPlaceholder('First Name').fill(employee.firstName);
    if (employee.middleName !== undefined) {
      await this.page.getByPlaceholder('Middle Name').fill(employee.middleName);
    }
    await this.page.getByPlaceholder('Last Name').fill(employee.lastName);
    if (employee.employeeId !== undefined) {
      await this.employeeIdInput.fill(employee.employeeId);
    }
  }

  /** Click Save. Valid forms navigate; invalid ones stay (specs assert). */
  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  /**
   * Fill, save, and return the new employee's empNumber (happy path).
   */
  async add(employee: EmployeeData): Promise<number> {
    await this.fillForm(employee);
    await this.save();

    await this.page.waitForURL(/viewPersonalDetails\/empNumber\/\d+/);
    const id = /empNumber\/(\d+)/.exec(this.page.url())?.[1];
    if (id === undefined) {
      throw new Error(`No empNumber found in URL after save: ${this.page.url()}`);
    }
    return Number(id);
  }
}
