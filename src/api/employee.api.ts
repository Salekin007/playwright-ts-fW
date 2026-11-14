import type { APIRequestContext } from '@playwright/test';

import { unwrapJson } from '@src/api/http';

/** Employee shape returned by the PIM API (verified against live responses). */
export interface EmployeeRecord {
  empNumber: number;
  firstName: string;
  middleName: string;
  lastName: string;
  employeeId: string | null;
}

/** Payload for creating an employee. */
export interface CreateEmployeePayload {
  firstName: string;
  middleName?: string;
  lastName: string;
}

/**
 * PIM employee API — endpoints and payload shapes captured from the real
 * network traffic the UI itself produces (do not guess: DELETE /{id} is a
 * 405 on this app; the working form is DELETE with an {ids:[...]} body).
 *
 *  - create:  POST   /web/index.php/api/v2/pim/employees
 *  - search:  GET    /web/index.php/api/v2/pim/employees?name={name}
 *  - delete:  DELETE /web/index.php/api/v2/pim/employees  body {ids:[...]}
 */
export class EmployeeApi {
  constructor(private readonly http: APIRequestContext) {}

  /** Create an employee and return the stored record (incl. empNumber). */
  async create(employee: CreateEmployeePayload): Promise<EmployeeRecord> {
    const res = await this.http.post('/web/index.php/api/v2/pim/employees', {
      data: employee,
    });
    const body = await unwrapJson<{ data: EmployeeRecord }>(res, 'EmployeeApi.create');
    return body.data;
  }

  /** Find employees whose name matches (same search the UI hints use). */
  async searchByName(name: string): Promise<EmployeeRecord[]> {
    const res = await this.http.get(
      `/web/index.php/api/v2/pim/employees?name=${encodeURIComponent(name)}`,
    );
    const body = await unwrapJson<{ data: EmployeeRecord[] }>(res, 'EmployeeApi.searchByName');
    return body.data ?? [];
  }

  /** Delete employees by their numeric empNumbers. */
  async delete(empNumbers: number[]): Promise<void> {
    const res = await this.http.delete('/web/index.php/api/v2/pim/employees', {
      data: { ids: empNumbers },
    });
    await unwrapJson<unknown>(res, 'EmployeeApi.delete');
  }
}
