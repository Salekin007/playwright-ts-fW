import type { APIRequestContext } from '@playwright/test';

import { ApiClient } from '@src/api/api-client';

import { test as appTest } from './app.fixture';

/**
 * Raw authenticated request context for CONTRACT-level API tests.
 *
 * The module API classes (EmployeeApi, UserApi) exist for setup/cleanup
 * and THROW on non-2xx via unwrapJson — which hides exactly the things
 * an API test must assert (status codes, response envelopes). This
 * fixture hands specs the bare APIRequestContext instead, so the tests
 * own every assertion. Auth is the same cookie-based session the UI
 * uses (storageState), reusing ApiClient rather than duplicating it.
 */
type ApiFixtures = {
  api: APIRequestContext;
};

export const test = appTest.extend<ApiFixtures>({
  api: async ({}, use) => {
    const client = await ApiClient.fromStorageState();
    await use(client.http);
    await client.dispose();
  },
});

export { expect } from '@playwright/test';
