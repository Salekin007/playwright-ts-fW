import { expect, test } from '@src/fixtures/pim.fixture';
import { EmployeeListPage } from '@src/pages/pim/employee-list.page';

/**
 * Search Employee — API setup, UI verification.
 *
 * The employee exists because the testEmployee fixture created it through
 * the API milliseconds before this test ran; the test itself only proves
 * the SEARCH behaviour. Unique last name => exactly one record expected.
 */
test('searching by last name finds exactly the created employee @smoke', async ({
  authenticatedPage,
  testEmployee,
}) => {
  const listPage = new EmployeeListPage(authenticatedPage);
  await listPage.goto();
  await listPage.searchByName(testEmployee.lastName);

  const row = listPage.table.row(testEmployee.lastName);
  await expect(row).toBeVisible();
  await expect(row).toContainText(testEmployee.firstName);
  await expect(row).toContainText(testEmployee.lastName);
  expect(await listPage.resultCount()).toBe(1);
});
