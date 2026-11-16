import type { EmployeeRecord } from '@src/api/employee.api';
import { createEmployee } from '@src/data/employee.factory';
import { expect, test } from '@src/fixtures/api.fixture';

/**
 * PIM employees API — contract tests.
 *
 * The module API classes (EmployeeApi…) exist for setup/cleanup and THROW
 * on non-2xx — they hide exactly what these specs must pin down. Every
 * status code and envelope below was captured from live traffic:
 *
 *   POST   /employees  {firstName,lastName}   -> 200 (not 201), {data:{…}}
 *   GET    /employees?name={lastName}         -> 200, {data:[…], meta:{total}}
 *   DELETE /employees  body {ids:[…]}         -> 200, {data:["<id>"]} — ids
 *                                                  come back as STRINGS
 */
interface CreateEnvelope {
  data: EmployeeRecord;
}

interface SearchEnvelope {
  data: EmployeeRecord[];
  meta: { total: number };
}

interface DeleteEnvelope {
  data: string[];
}

const EMPLOYEES = '/web/index.php/api/v2/pim/employees';

test('creating an employee returns 200 with its full record @regression', async ({ api }) => {
  const employee = createEmployee();
  let empNumber = 0;

  try {
    const res = await api.post(EMPLOYEES, { data: employee });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as CreateEnvelope;
    empNumber = body.data.empNumber;
    expect(empNumber).toBeGreaterThan(0);
    expect(body.data.firstName).toBe(employee.firstName);
    expect(body.data.lastName).toBe(employee.lastName);
  } finally {
    // Unconditional on purpose: if creation failed, empNumber is 0 and the
    // delete is a harmless no-op error we swallow.
    await api.delete(EMPLOYEES, { data: { ids: [empNumber] } }).catch(() => undefined);
  }
});

test('searching by name returns exactly the created employee @regression', async ({ api }) => {
  const employee = createEmployee();
  const created = await api.post(EMPLOYEES, { data: employee });
  const { empNumber } = ((await created.json()) as CreateEnvelope).data;

  try {
    const res = await api.get(`${EMPLOYEES}?name=${encodeURIComponent(employee.lastName)}`);

    expect(res.status()).toBe(200);
    const body = (await res.json()) as SearchEnvelope;
    expect(body.meta.total).toBe(1);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.empNumber).toBe(empNumber);
    expect(body.data[0]?.lastName).toBe(employee.lastName);
  } finally {
    await api.delete(EMPLOYEES, { data: { ids: [empNumber] } }).catch(() => undefined);
  }
});

test('deleting an employee echoes its id and removes it @regression', async ({ api }) => {
  const employee = createEmployee();
  const created = await api.post(EMPLOYEES, { data: employee });
  const { empNumber } = ((await created.json()) as CreateEnvelope).data;

  const res = await api.delete(EMPLOYEES, { data: { ids: [empNumber] } });
  expect(res.status()).toBe(200);
  const body = (await res.json()) as DeleteEnvelope;
  expect(body.data).toEqual([String(empNumber)]);

  // State-based proof: the search no longer finds the record.
  const after = await api.get(`${EMPLOYEES}?name=${encodeURIComponent(employee.lastName)}`);
  const afterBody = (await after.json()) as SearchEnvelope;
  expect(afterBody.meta.total).toBe(0);
  expect(afterBody.data).toHaveLength(0);
});
