import { ApiClient } from '@src/api/api-client';
import type { EmployeeRecord } from '@src/api/employee.api';
import type { UserRecord } from '@src/api/user.api';
import { UserApi } from '@src/api/user.api';
import { createUser, createUserEmployee } from '@src/data/user.factory';

import { test as pimTest } from './pim.fixture';

/** A system user together with the employee that carries its login. */
export interface TestUser {
  user: UserRecord;
  employee: EmployeeRecord;
}

/**
 * Admin fixtures on top of the PIM fixtures (reusing employeeApi — a
 * system user cannot exist without an employee to hang off).
 *
 * `userApi` — authenticated API client for user setup/cleanup.
 * `testUser` — a unique employee + ESS user created through the API
 * before the test; both are deleted after it. UI-created users can be
 * cleaned through the same API by username lookup.
 */
type AdminFixtures = {
  userApi: UserApi;
  testUser: TestUser;
};

export const test = pimTest.extend<AdminFixtures>({
  userApi: async ({}, use) => {
    const client = await ApiClient.fromStorageState();
    await use(new UserApi(client.http));
    await client.dispose();
  },
  testUser: async ({ employeeApi, userApi }, use, testInfo) => {
    const employee = await employeeApi.create(createUserEmployee());
    const user = await userApi.create({
      ...createUser(),
      empNumber: employee.empNumber,
    });
    // Attach both records for post-mortem debugging. Note: this is the API
    // RESPONSE — it contains no password. Never attach credentials.
    await testInfo.attach('test user + employee (API setup)', {
      body: JSON.stringify({ user, employee }, null, 2),
      contentType: 'application/json',
    });
    await use({ user, employee });

    // Best-effort: a UI-delete test already removed the user.
    await userApi.delete([user.id]).catch(() => undefined);
    await employeeApi.delete([employee.empNumber]).catch(() => undefined);
  },
});

export { expect } from '@playwright/test';
