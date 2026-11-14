import type { Locator, Page } from '@playwright/test';

import { AutocompleteComponent } from '@src/components/autocomplete.component';
import { DatePickerComponent } from '@src/components/date-picker.component';
import { SelectComponent } from '@src/components/select.component';
import { routes } from '@src/pages/routes';

/**
 * Page Object for Leave > Apply (admin assigning leave to an employee).
 *
 * COMPOSES three step-4 components: Employee Name = Autocomplete,
 * Leave Type = Select, From/To = DatePicker (the app's yyyy-dd-mm quirk
 * lives inside the component, not here).
 *
 * Verified live behaviour that shapes this object:
 *  - submitting the To date for an employee with ZERO balance opens a
 *    "Confirm Leave Assignment" dialog ("...does not have sufficient
 *    leave balance... Click OK to confirm") — real behaviour of this
 *    demo, surfaced as a locator + accept action so a spec can assert it
 *  - KNOWN LIMITATION (verified): even after confirming, the app rejects
 *    the assignment client-side ("Error: Invalid Parameter", no network
 *    call) for zero-balance employees, and this build exposes no
 *    entitlement-write API to grant balance first (probed paths 404).
 *    The full happy-path assignment is therefore NOT covered here —
 *    documented, not faked.
 *
 * No assertions in here.
 */
export class ApplyLeavePage {
  private readonly page: Page;

  private readonly employeeName: AutocompleteComponent;
  private readonly leaveType: SelectComponent;
  private readonly fromDate: DatePickerComponent;
  private readonly toDate: DatePickerComponent;

  /** The zero-balance confirmation dialog (".oxd-dialog-container-default"). */
  readonly confirmDialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.employeeName = new AutocompleteComponent(page.locator('.oxd-autocomplete-wrapper'));
    this.leaveType = new SelectComponent(page.locator('.oxd-select-wrapper').first());
    this.fromDate = new DatePickerComponent(page.locator('.oxd-date-input').nth(0));
    this.toDate = new DatePickerComponent(page.locator('.oxd-date-input').nth(1));
    this.confirmDialog = page.locator('.oxd-dialog-container-default');
  }

  async goto(): Promise<void> {
    await this.page.goto(routes.leaveApply, { waitUntil: 'domcontentloaded' });
  }

  /** Fill the whole request form (employee, type, date range). */
  async fillLeaveRequest(
    employeeLastName: string,
    leaveTypeName: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<void> {
    await this.employeeName.select(employeeLastName, employeeLastName);
    await this.leaveType.select(leaveTypeName);
    await this.fromDate.set(fromDate);
    await this.toDate.set(toDate);
  }

  /** Accept the insufficient-balance confirmation dialog ("Ok"). */
  async acceptConfirmDialog(): Promise<void> {
    await this.confirmDialog.getByRole('button', { name: 'Ok', exact: true }).click();
  }

  /** Submit the request (verified: rejected client-side for 0 balance). */
  async assign(): Promise<void> {
    await this.page.getByRole('button', { name: 'Assign' }).click();
  }
}
