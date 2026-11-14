/**
 * Test-data factory for employees.
 *
 * Every test builds its own employee with a unique last name (timestamp +
 * sequence + random tail), so:
 *  - parallel workers can never collide on the same record,
 *  - searches find exactly their own data (assertions stay strict),
 *  - leftovers from crashed runs are identifiable by the "Employee..." prefix.
 *
 * Overrides let a test tweak one field without re-declaring the rest —
 * specs never hard-code employee data inline.
 */
export interface EmployeeData {
  firstName: string;
  middleName?: string;
  lastName: string;
}

/** Monotonic guard against same-millisecond collisions across workers. */
let sequence = 0;

function uniqueSuffix(): string {
  sequence += 1;
  return `${Date.now().toString(36)}-${sequence.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** A fresh, unique employee; pass overrides to tailor specific fields. */
export function createEmployee(overrides: Partial<EmployeeData> = {}): EmployeeData {
  return {
    firstName: 'Auto',
    lastName: `Employee${uniqueSuffix()}`,
    ...overrides,
  };
}
