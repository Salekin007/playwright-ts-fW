import { expect, test } from '@src/fixtures/pim.fixture';
import { EmployeeDetailsPage } from '@src/pages/pim/employee-details.page';
import { EmployeeListPage } from '@src/pages/pim/employee-list.page';

/**
 * Edit Employee — API setup, UI edit, persistence proof.
 *
 * Persistence is verified by RELOADING the page after saving: reading the
 * same input we just typed into proves nothing (the input would hold the
 * typed value even if the save had failed); after a reload the value can
 * only come from the server.
 */
test('editing an employee persists the new first name @regression', async ({
  authenticatedPage,
  testEmployee,
  toast,
}) => {
  const listPage = new EmployeeListPage(authenticatedPage);
  await listPage.goto();
  await listPage.searchByName(testEmployee.lastName);
  await listPage.openEmployee(testEmployee.lastName);

  // We landed on OUR employee's details page, not somebody else's.
  await expect(authenticatedPage).toHaveURL(new RegExp(`empNumber/${testEmployee.empNumber}$`));

  const detailsPage = new EmployeeDetailsPage(authenticatedPage);
  const editedFirstName = `${testEmployee.firstName}Edited`;

  // Precondition: the form shows the SERVER's value for our employee —
  // proves the details GET has been bound before we start editing.
  await expect(detailsPage.firstNameInput).toHaveValue(testEmployee.firstName);

  await detailsPage.updateFirstName(editedFirstName);

  await toast.waitFor('success');
  expect(await toast.getText('success')).toContain('Successfully Updated');

  // Reload — the shown value must now come from the server, not our input.
  // toHaveValue polls: the Vue form mounts with EMPTY inputs and only
  // fills them once the personal-details GET lands, so a one-shot
  // inputValue() read races the data load (verified the hard way).
  await authenticatedPage.reload({ waitUntil: 'domcontentloaded' });
  await expect(detailsPage.firstNameInput).toHaveValue(editedFirstName);
});
