import { createEmployee } from '@src/data/employee.factory';
import type { EmployeeData } from '@src/data/employee.factory';

/** System-user roles as shown in the Admin UI (verified live). */
export type UserRole = 'Admin' | 'ESS';

/** Account states as shown in the Admin UI. */
export type UserStatus = 'Enabled' | 'Disabled';

/** Everything needed to create one system user. */
export interface UserData {
  username: string;
  password: string;
  role: UserRole;
  status: UserStatus;
}

/**
 * Test-data factory for system users.
 *
 * Unique username per call (timestamp + random) so parallel workers never
 * collide and searches find exactly their own user. The password satisfies
 * OrangeHRM's strength rules (lower, upper, digit, special, length) —
 * generated, never hard-coded in specs.
 */
export function createUser(overrides: Partial<UserData> = {}): UserData {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    username: `user${suffix}`,
    password: `Pw${suffix}!aA9`,
    role: 'ESS',
    status: 'Enabled',
    ...overrides,
  };
}

/**
 * The employee a system user must hang off. A dedicated generated employee
 * keeps the user fully isolated from demo data (and gives the UI's
 * Employee Name autocomplete something unique to pick).
 */
export function createUserEmployee(): EmployeeData {
  return createEmployee({ firstName: 'Usr' });
}
