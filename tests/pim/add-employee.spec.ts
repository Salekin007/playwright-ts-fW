import { createEmployee } from '@src/data/employee.factory';
import { expect, test } from '@src/fixtures/pim.fixture';
import { AddEmployeePage } from '@src/pages/pim/add-employee.page';
import { EmployeeListPage } from '@src/pages/pim/employee-list.page';

/**
 * Add Employee — UI journey + API cleanup.
 *
 * The employee is created through the UI (that IS the behaviour under
 * test), its id comes back from the redirected URL, and the API removes
 * it afterwards — in a finally block, so cleanup happens even if an
 * assertion fails first.
 */
test('adding an employee via the UI shows it in search @regression', async ({
  authenticatedPage,
  employeeApi,
}) => {
  const employee = createEmployee();

  const addPage = new AddEmployeePage(authenticatedPage);
  await addPage.goto();
  const empNumber = await addPage.add(employee);
  expect(empNumber).toBeGreaterThan(0);

  try {
    const listPage = new EmployeeListPage(authenticatedPage);
    await listPage.goto();
    await listPage.searchByName(employee.lastName);

    await expect(listPage.table.row(employee.lastName)).toBeVisible();
    expect(await listPage.resultCount()).toBe(1);
  } finally {
    // Cleanup must survive assertion failures — that is what finally is for.
    await employeeApi.delete([empNumber]).catch(() => undefined);
  }
});
