import type { APIRequestContext } from '@playwright/test';

import { unwrapJson } from '@src/api/http';
import type { UserRole, UserStatus } from '@src/data/user.factory';

/**
 * Role names -> API role ids, both verified live by creating a user with
 * each id and reading userRole.name back from the response.
 */
const USER_ROLE_IDS: Record<UserRole, number> = {
  Admin: 1,
  ESS: 2,
};

/** System-user shape returned by the Admin API (verified live responses). */
export interface UserRecord {
  id: number;
  /** NOTE: the API answers with "userName" while the request takes "username". */
  userName: string;
  status: boolean;
  userRole: { id: number; name: string };
  employee: { empNumber: number; firstName: string; lastName: string };
}

/** Payload for creating a system user. */
export interface CreateUserPayload {
  username: string;
  password: string;
  role: UserRole;
  /** UI label ("Enabled"/"Disabled"); the API boolean lives in this class. */
  status: UserStatus;
  /** Employee the login belongs to (a user cannot exist without one). */
  empNumber: number;
}

/**
 * Admin user API — endpoint and payload shapes captured from the UI's own
 * traffic (verified: this shape returns 200; a guessed "userRole" string
 * returns 422 invalidParamKeys).
 *
 *  - create:  POST   /web/index.php/api/v2/admin/users
 *  - search:  GET    /web/index.php/api/v2/admin/users?username={name}
 *  - delete:  DELETE /web/index.php/api/v2/admin/users  body {ids:[...]}
 */
export class UserApi {
  constructor(private readonly http: APIRequestContext) {}

  /** Create a system user and return the stored record (incl. its id). */
  async create(payload: CreateUserPayload): Promise<UserRecord> {
    const res = await this.http.post('/web/index.php/api/v2/admin/users', {
      data: {
        username: payload.username,
        password: payload.password,
        status: payload.status === 'Enabled',
        userRoleId: USER_ROLE_IDS[payload.role],
        empNumber: payload.empNumber,
      },
    });
    const body = await unwrapJson<{ data: UserRecord }>(res, 'UserApi.create');
    return body.data;
  }

  /** Find users by exact-ish username filter (same call the UI search uses). */
  async searchByUsername(username: string): Promise<UserRecord[]> {
    const res = await this.http.get(
      `/web/index.php/api/v2/admin/users?username=${encodeURIComponent(username)}`,
    );
    const body = await unwrapJson<{ data: UserRecord[] }>(res, 'UserApi.searchByUsername');
    return body.data ?? [];
  }

  /** Delete users by their numeric ids. */
  async delete(ids: number[]): Promise<void> {
    const res = await this.http.delete('/web/index.php/api/v2/admin/users', {
      data: { ids },
    });
    await unwrapJson<unknown>(res, 'UserApi.delete');
  }
}
