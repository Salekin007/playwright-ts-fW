import { expect, test } from '@src/fixtures/pim.fixture';
import { EmployeeListPage } from '@src/pages/pim/employee-list.page';

/**
 * Delete Employee — API setup, UI delete, disappearance proof.
 *
 * Verified app behaviour: after an in-place delete the "(N) Records Found"
 * label goes STALE while the rows vanish — so the assertion targets the
 * rows themselves, not the count label.
 */
test('deleting an employee removes it from the list @regression', async ({
  authenticatedPage,
  testEmployee,
  toast,
}) => {
  const listPage = new EmployeeListPage(authenticatedPage);
  await listPage.goto();
  await listPage.searchByName(testEmployee.lastName);

  const row = listPage.table.row(testEmployee.lastName);
  await expect(row).toBeVisible();

  await listPage.deleteEmployee(testEmployee.lastName);

  await toast.waitFor('success');
  expect(await toast.getText('success')).toContain('Successfully Deleted');

  await expect(listPage.table.rows()).toHaveCount(0);
});
