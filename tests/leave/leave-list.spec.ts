import { createEmployee } from '@src/data/employee.factory';
import { expect, test } from '@src/fixtures/pim.fixture';
import { LeaveListPage } from '@src/pages/leave/leave-list.page';

/**
 * Leave List — a fresh employee has no leave records, so a search for
 * them must yield an empty result set. (Verified: the leave list fetch
 * is not an /api/ call, so no response-sync — assertions poll instead.)
 */
test('searching leave records for a fresh employee returns no rows @smoke', async ({
  authenticatedPage,
  employeeApi,
}) => {
  const employee = await employeeApi.create(createEmployee({ firstName: 'Lv' }));

  const listPage = new LeaveListPage(authenticatedPage);
  await listPage.goto();
  await listPage.searchByEmployee(employee.lastName);

  await expect(listPage.table.rows()).toHaveCount(0);
});
