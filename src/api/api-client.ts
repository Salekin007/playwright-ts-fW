import { request } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

import { AUTH_STATE_PATH } from '@src/config/constants';
import { config } from '@src/config/env';

/**
 * Base HTTP client for the application's own API.
 *
 * Reuses the session the setup project already established: the admin
 * storageState carries the `orangehrm` session cookie, and a Playwright
 * request context can be seeded with it exactly like a browser context
 * (verified live: cookie-only auth works, no CSRF header needed).
 *
 * Why an API layer at all: setup and cleanup through the UI is slow and
 * brittle — the point of a test is the behaviour it verifies, not the
 * 30 seconds of clicking it takes to build its preconditions.
 */
export class ApiClient {
  private readonly context: APIRequestContext;

  private constructor(context: APIRequestContext) {
    this.context = context;
  }

  /** Create a client authenticated with the saved admin session. */
  static async fromStorageState(): Promise<ApiClient> {
    const context = await request.newContext({
      baseURL: config.baseUrl,
      storageState: AUTH_STATE_PATH,
      // Generous per-request budget: the shared demo server regularly
      // stalls >10s, and the request-context default would cut calls off
      // long before the surrounding test timeout does.
      timeout: config.timeouts.test,
    });
    return new ApiClient(context);
  }

  /** The raw request context, passed to module API classes. */
  get http(): APIRequestContext {
    return this.context;
  }

  /** Always dispose — request contexts hold real connections. */
  async dispose(): Promise<void> {
    await this.context.dispose();
  }
}
