import { createEmployee } from '@src/data/employee.factory';
import { expect, test } from '@src/fixtures/pim.fixture';
import { ApplyLeavePage } from '@src/pages/leave/apply-leave.page';

/**
 * Apply Leave — verified behaviour of this demo build.
 *
 * A freshly created employee has ZERO leave balance (verified via API and
 * UI). Committing the To date for such an employee opens a "Confirm Leave
 * Assignment" dialog — this spec covers that real flow. The deeper
 * happy path (successful assignment) is NOT coverable here: after
 * confirming, the app rejects the request client-side ("Invalid
 * Parameter", no network call) and this build exposes no entitlement-write
 * API to grant balance first — documented in ApplyLeavePage, not faked.
 */
test('zero-balance leave request asks for confirmation before assignment @regression', async ({
  authenticatedPage,
  employeeApi,
}) => {
  const employee = await employeeApi.create(createEmployee({ firstName: 'Lv' }));
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  const dayAfter = new Date(Date.now() + 2 * 24 * 3600 * 1000);

  const applyPage = new ApplyLeavePage(authenticatedPage);
  await applyPage.goto();
  await applyPage.fillLeaveRequest(employee.lastName, 'CAN - Bereavement', tomorrow, dayAfter);

  // The confirmation dialog is the app's real response to a zero-balance request.
  await expect(applyPage.confirmDialog).toBeVisible();
  await expect(applyPage.confirmDialog).toContainText('does not have sufficient leave balance');
  await expect(applyPage.confirmDialog).toContainText('Confirm Leave Assignment');

  await applyPage.acceptConfirmDialog();
  await expect(applyPage.confirmDialog).toBeHidden();
});
