import { expect, test } from '@src/fixtures/admin.fixture';
import { UserManagementPage } from '@src/pages/admin/user-management.page';

/**
 * Search User — API setup, UI verification. The user exists because the
 * testUser fixture created it through the API; the test proves SEARCH.
 */
test('searching by username finds exactly the created user @smoke', async ({
  authenticatedPage,
  testUser,
}) => {
  const listPage = new UserManagementPage(authenticatedPage);
  await listPage.goto();
  await listPage.searchByUsername(testUser.user.userName);

  const row = listPage.table.row(testUser.user.userName);
  await expect(row).toBeVisible();
  await expect(row).toContainText(testUser.user.employee.lastName);
  await expect(row).toContainText(testUser.user.userRole.name);
  await expect(row).toContainText('Enabled');
  expect(await listPage.resultCount()).toBe(1);
});
