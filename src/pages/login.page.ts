import type { Locator, Page } from '@playwright/test';

import { authMessages } from '@src/data/auth.data';

import { routes } from './routes';

/**
 * Page Object for the OrangeHRM login page.
 *
 * Responsibilities (and nothing else):
 *  - KNOW the locators of the login page
 *  - OFFER high-level actions (goto, login)
 *
 * It deliberately contains ZERO assertions — verification lives in specs.
 * A page object that asserts cannot be reused for setup flows (where the
 * outcome is asserted differently) and hides failures inside wrappers.
 *
 * Locator strategy (verified against the live DOM):
 *  - username/password inputs have no <label for=...> association, so
 *    getByLabel does NOT resolve them; their accessible name comes from
 *    the placeholder -> getByRole('textbox', { name: 'Username' }).
 *  - the login control is a real <button type="submit">Login</button>.
 */
export class LoginPage {
  private readonly page: Page;

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  /** Error banner shown for wrong username/password ("Invalid credentials"). */
  readonly invalidCredentialsAlert: Locator;
  /** "Required" spans under each empty field after submitting the form bare. */
  readonly requiredFieldErrors: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByRole('textbox', { name: 'Username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.invalidCredentialsAlert = page.getByText(authMessages.invalidCredentials);
    this.requiredFieldErrors = page.getByText(authMessages.required, { exact: true });
  }

  /**
   * Open the login page.
   *
   * `waitUntil: 'domcontentloaded'`: the default 'load' waits for every
   * sub-resource and is fragile on this shared demo site (observed >20s
   * under parallel workers). Element interactions auto-wait anyway, so
   * DOM readiness is all the guarantee goto needs to give.
   */
  async goto(): Promise<void> {
    await this.page.goto(routes.login, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Fill credentials and submit the form.
   *
   * CAUTION (verified on the live app): the form is CSRF-protected and the
   * token is NOT refreshed after a failed attempt — a second login attempt
   * on the same page load will fail even with correct credentials.
   * One `login()` call per page load.
   */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
