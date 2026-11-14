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

  // test.step does not change behaviour — it groups the report so a
  // failure points at the PHASE (create vs verify), not just the line.
  const empNumber = await test.step('create the employee through the UI form', async () => {
    const addPage = new AddEmployeePage(authenticatedPage);
    await addPage.goto();
    const id = await addPage.add(employee);
    expect(id).toBeGreaterThan(0);
    return id;
  });

  try {
    await test.step('verify the employee appears in search exactly once', async () => {
      const listPage = new EmployeeListPage(authenticatedPage);
      await listPage.goto();
      await listPage.searchByName(employee.lastName);

      await expect(listPage.table.row(employee.lastName)).toBeVisible();
      expect(await listPage.resultCount()).toBe(1);
    });
  } finally {
    // Cleanup must survive assertion failures — that is what finally is for.
    await employeeApi.delete([empNumber]).catch(() => undefined);
  }
});
