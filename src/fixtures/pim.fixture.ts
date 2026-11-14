import { ApiClient } from '@src/api/api-client';
import type { EmployeeRecord } from '@src/api/employee.api';
import { EmployeeApi } from '@src/api/employee.api';
import { createEmployee } from '@src/data/employee.factory';

import { test as appTest } from './app.fixture';

/**
 * PIM fixtures on top of the app fixtures.
 *
 * `employeeApi` — an authenticated API client for data setup/cleanup.
 * `testEmployee` — a fresh, unique employee created through the API
 * BEFORE the test and deleted AFTER it. Tests receive the full stored
 * record (empNumber, names) and stay fully independent: no test depends
 * on another's data or order, and parallel workers can never collide
 * because every employee has a unique generated last name.
 *
 * The teardown delete is best-effort on purpose: a test that deletes the
 * employee through the UI (the delete spec) leaves nothing to clean up.
 */
type PimFixtures = {
  employeeApi: EmployeeApi;
  testEmployee: EmployeeRecord;
};

export const test = appTest.extend<PimFixtures>({
  employeeApi: async ({}, use) => {
    const client = await ApiClient.fromStorageState();
    await use(new EmployeeApi(client.http));
    await client.dispose();
  },
  testEmployee: async ({ employeeApi }, use, testInfo) => {
    const employee = await employeeApi.create(createEmployee());
    // Attach the record: any failed run shows exactly which employee this
    // test owned — priceless when debugging data or collision issues.
    await testInfo.attach('test employee (API setup)', {
      body: JSON.stringify(employee, null, 2),
      contentType: 'application/json',
    });
    await use(employee);
    await employeeApi.delete([employee.empNumber]).catch(() => undefined);
  },
});

export { expect } from '@playwright/test';
