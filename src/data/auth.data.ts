import { config } from '@src/config/env';

/**
 * Test data and expected UI texts for the auth module.
 *
 * Why a separate data layer:
 *  - Specs stay about BEHAVIOUR; inputs and expected texts live as data,
 *    so a wording change in the app is a one-line fix, not a spec hunt.
 *  - Message texts are shared: LoginPage builds its locators from these
 *    constants and specs assert through those same locators — text is
 *    declared exactly once.
 *  - Valid credentials come from env config (never committed); only
 *    deliberately-invalid values are literal here.
 */

/** Exact user-visible texts on the login page (verified against the live app). */
export const authMessages = {
  /** Alert shown for a wrong username or password. */
  invalidCredentials: 'Invalid credentials',
  /** Per-field validation shown after submitting the form with empty fields. */
  required: 'Required',
} as const;

/**
 * Wrong-password case for the invalid-login test.
 *
 * The username stays VALID on purpose: with a valid user + wrong password,
 * the failure is unambiguously about the password — mixing an invalid
 * username would make the case prove two things at once.
 */
export const invalidPasswordCredentials = {
  username: config.credentials.username,
  password: 'Definitely-Wrong-Password-123!',
} as const;
