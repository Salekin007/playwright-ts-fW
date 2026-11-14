import { createUser, createUserEmployee } from '@src/data/user.factory';
import { expect, test } from '@src/fixtures/admin.fixture';
import { AddUserPage } from '@src/pages/admin/add-user.page';
import { UserManagementPage } from '@src/pages/admin/user-management.page';

/**
 * Add User — UI journey (the behaviour under test), API cleanup.
 *
 * The supporting employee comes from the API (the autocomplete needs an
 * existing employee); the user itself is created through the form. This
 * flow shows NO toast (verified live) — success is proven by search.
 */
test('adding a system user via the UI shows it in search @regression', async ({
  authenticatedPage,
  employeeApi,
  userApi,
}) => {
  const employee = await employeeApi.create(createUserEmployee());
  const user = createUser();

  try {
    const addPage = new AddUserPage(authenticatedPage);
    await addPage.goto();
    await addPage.addUser(user, employee.lastName);

    // addUser() lands back on the list — search from there.
    const listPage = new UserManagementPage(authenticatedPage);
    await listPage.searchByUsername(user.username);

    const row = listPage.table.row(user.username);
    await expect(row).toBeVisible();
    await expect(row).toContainText(user.role);
    await expect(row).toContainText(user.status);
    expect(await listPage.resultCount()).toBe(1);
  } finally {
    // The UI created the user — look it up via the API, then clean both.
    const created = await userApi.searchByUsername(user.username).catch(() => []);
    for (const record of created) {
      await userApi.delete([record.id]).catch(() => undefined);
    }
    await employeeApi.delete([employee.empNumber]).catch(() => undefined);
  }
});
