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
test('submitting without a first name asks for it @regression', async ({ authenticatedPage }) => {
  const addPage = new AddEmployeePage(authenticatedPage);
  await addPage.goto();

  // Last name filled, first name left empty — the fully-empty form does
  // NOT trigger validation (verified live); the browser-side check needs
  // at least one filled field to fire.
  await addPage.fillForm(createEmployee({ firstName: '' }));
  await addPage.save();

  await expect(addPage.fieldErrors.first()).toHaveText('Required');
  await expect(authenticatedPage).toHaveURL(/pim\/addEmployee/);
});

test('reusing an existing employee id is rejected @regression', async ({
  authenticatedPage,
  employeeApi,
}) => {
  // The v2 create API rejects a custom employeeId (422 "Invalid Parameter",
  // verified live) — so employee 1 must be created through the UI form.
  const marker = Date.now().toString(36).slice(-6);
  const employeeId = `DUP${marker}`; // ≤ 10 chars — the input's verified limit
  let firstEmpNumber = 0;

  try {
    const addPage = new AddEmployeePage(authenticatedPage);

    firstEmpNumber = await addPage.add(
      createEmployee({ lastName: `Employee${marker}one`, employeeId }),
    );

    await addPage.goto();
    await addPage.fillForm(createEmployee({ lastName: `Employee${marker}two`, employeeId }));
    await addPage.save();

    await expect(addPage.fieldErrors.first()).toHaveText('Employee Id already exists');
    await expect(authenticatedPage).toHaveURL(/pim\/addEmployee/);
  } finally {
    // Unconditional: if creation never finished, 0 is not a real id and the
    // delete attempt is a swallowed no-op error.
    await employeeApi.delete([firstEmpNumber]).catch(() => undefined);
  }
});

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
