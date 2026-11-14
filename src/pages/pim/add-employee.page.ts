import type { Page } from '@playwright/test';

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
 * No assertions here — add() returns the id, the spec decides what to check.
 */
export class AddEmployeePage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto(routes.pimAddEmployee, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Fill the name fields, save, and return the new employee's empNumber.
   *
   * Middle name is optional in the data model and only filled when set —
   * filling "" into the middle input would be indistinguishable from not
   * having one, but would still dirty the form.
   */
  async add(employee: EmployeeData): Promise<number> {
    await this.page.getByPlaceholder('First Name').fill(employee.firstName);
    if (employee.middleName !== undefined) {
      await this.page.getByPlaceholder('Middle Name').fill(employee.middleName);
    }
    await this.page.getByPlaceholder('Last Name').fill(employee.lastName);
    await this.page.getByRole('button', { name: 'Save' }).click();

    await this.page.waitForURL(/viewPersonalDetails\/empNumber\/\d+/);
    const id = /empNumber\/(\d+)/.exec(this.page.url())?.[1];
    if (id === undefined) {
      throw new Error(`No empNumber found in URL after save: ${this.page.url()}`);
    }
    return Number(id);
  }
}
