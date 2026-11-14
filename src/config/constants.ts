/**
 * Framework-level constants that several files must agree on.
 *
 * The saved-session path is referenced by BOTH the setup project
 * (tests/auth/auth.setup.ts writes the file) and the auth fixture
 * (tests/fixtures/auth.fixture.ts reads it) — a shared constant
 * prevents them from drifting apart.
 */

/** Directory holding persisted auth state (gitignored — session cookies). */
export const AUTH_DIR = '.auth';

/** StorageState file written once per run by the setup project. */
export const AUTH_STATE_PATH = `${AUTH_DIR}/admin.json`;
