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
test('creating a user with an already-taken username is rejected @regression', async ({
  authenticatedPage,
  testUser,
}) => {
  const addPage = new AddUserPage(authenticatedPage);
  await addPage.goto();

  // A fully valid form — ONLY the username collides with the API-created
  // testUser, so the single inline error is unambiguous.
  await addPage.fillUser(
    { ...createUser(), username: testUser.user.userName },
    testUser.employee.lastName,
  );
  await addPage.save();

  await expect(addPage.fieldErrors).toHaveCount(1);
  await expect(addPage.fieldErrors.first()).toHaveText('Already exists');
  await expect(authenticatedPage).toHaveURL(/admin\/saveSystemUser/);
});

test('adding a system user via the UI shows it in search @regression', async ({
  authenticatedPage,
  employeeApi,
  userApi,
}) => {
  const employee = await test.step('create the supporting employee via the API', () =>
    employeeApi.create(createUserEmployee()));

  const user = createUser();

  try {
    await test.step('add the user through the UI form', async () => {
      const addPage = new AddUserPage(authenticatedPage);
      await addPage.goto();
      await addPage.addUser(user, employee.lastName);
    });

    await test.step('verify the user appears in search with role and status', async () => {
      // addUser() lands back on the list — search from there.
      const listPage = new UserManagementPage(authenticatedPage);
      await listPage.searchByUsername(user.username);

      const row = listPage.table.row(user.username);
      await expect(row).toBeVisible();
      await expect(row).toContainText(user.role);
      await expect(row).toContainText(user.status);
      expect(await listPage.resultCount()).toBe(1);
    });
  } finally {
    // The UI created the user — look it up via the API, then clean both.
    const created = await userApi.searchByUsername(user.username).catch(() => []);
    for (const record of created) {
      await userApi.delete([record.id]).catch(() => undefined);
    }
    await employeeApi.delete([employee.empNumber]).catch(() => undefined);
  }
});
