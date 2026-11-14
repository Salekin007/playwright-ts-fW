import { expect, test } from '@playwright/test';

import { config } from '@src/config/env';
import { invalidPasswordCredentials } from '@src/data/auth.data';
import { DashboardPage } from '@src/pages/dashboard.page';
import { LoginPage } from '@src/pages/login.page';
import { routes } from '@src/pages/routes';

/**
 * Authentication flow specs — login, validation, logout.
 *
 * These tests intentionally use the plain `page` fixture: every test gets
 * a FRESH anonymous context. Auth tests must start logged out; the shared
 * authenticated session belongs to `tests/fixtures/auth.fixture.ts`.
 *
 * NOTE (app quirk, verified live): the login form does not refresh its
 * CSRF token after a failed submit, so a second login attempt on the same
 * page load fails even with valid credentials. Each test therefore
 * performs at most ONE login attempt on its own fresh page.
 */
test.describe('Login', () => {
  test('valid credentials log the admin in @smoke', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(config.credentials.username, config.credentials.password);

    const dashboardPage = new DashboardPage(page);
    await expect(page).toHaveURL(routes.dashboard);
    await expect(dashboardPage.userMenu).toBeVisible();
  });

  test('invalid password shows an error and stays on the login page @regression', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(invalidPasswordCredentials.username, invalidPasswordCredentials.password);

    await expect(loginPage.invalidCredentialsAlert).toBeVisible();
    await expect(page).toHaveURL(routes.login);
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('submitting empty fields asks for both username and password @regression', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Submit bare — neither field filled.
    await loginPage.loginButton.click();

    // One "Required" message under each input.
    await expect(loginPage.requiredFieldErrors).toHaveCount(2);
    await expect(page).toHaveURL(routes.login);
  });
});

test.describe('Logout', () => {
  test('logging out returns the admin to the login page @smoke', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(config.credentials.username, config.credentials.password);

    const dashboardPage = new DashboardPage(page);
    await expect(dashboardPage.userMenu).toBeVisible();

    await dashboardPage.logout();

    await expect(page).toHaveURL(routes.login);
    await expect(loginPage.loginButton).toBeVisible();
  });
});
