import { createUser, createUserEmployee } from '@src/data/user.factory';
import { expect, test } from '@src/fixtures/admin.fixture';
import { UserManagementPage } from '@src/pages/admin/user-management.page';

/**
 * Role filter — for each role a user of that role exists (our own data,
 * no reliance on demo rows), the filter is applied, and EVERY visible
 * row is asserted to carry that role.
 *
 * Per-row assertions rather than a hasNotText filter over the table:
 * usernames can accidentally contain role text ("adminuser..."), which
 * would make a substring filter pass vacuously.
 */
test.describe('Filter by User Role @regression', () => {
  test('Admin filter shows only Admin users', async ({
    authenticatedPage,
    employeeApi,
    userApi,
  }) => {
    const employee = await employeeApi.create(createUserEmployee());
    const user = await userApi.create({
      ...createUser({ role: 'Admin' }),
      empNumber: employee.empNumber,
    });

    try {
      const listPage = new UserManagementPage(authenticatedPage);
      await listPage.goto();
      await listPage.filterByRole('Admin');

      // Our own Admin user must be in the results...
      await expect(listPage.table.row(user.userName)).toBeVisible();
      // ...and no visible row may lack the role.
      for (const row of await listPage.table.rows().all()) {
        await expect(row).toContainText('Admin');
      }
    } finally {
      await userApi.delete([user.id]).catch(() => undefined);
      await employeeApi.delete([employee.empNumber]).catch(() => undefined);
    }
  });

  test('ESS filter shows only ESS users', async ({ authenticatedPage, testUser }) => {
    const listPage = new UserManagementPage(authenticatedPage);
    await listPage.goto();
    await listPage.filterByRole('ESS');

    // The fixture's user is ESS — it must be found...
    await expect(listPage.table.row(testUser.user.userName)).toBeVisible();
    // ...and every visible row must be ESS.
    for (const row of await listPage.table.rows().all()) {
      await expect(row).toContainText('ESS');
    }
  });
});
