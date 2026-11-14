/**
 * Application URL routes — single source of truth for navigation.
 *
 * Pages call `page.goto(routes.login)`, tests assert against
 * `expect(page).toHaveURL(...)`. If the app ever changes a path, it
 * changes in exactly one place instead of being hunted across specs.
 *
 * These are paths relative to `baseURL` (set in playwright.config.ts),
 * so the same constants work against any environment.
 */
export const routes = {
  login: '/web/index.php/auth/login',
  dashboard: '/web/index.php/dashboard/index',
  admin: '/web/index.php/admin/viewSystemUsers',
  adminAddUser: '/web/index.php/admin/saveSystemUser',
  pim: '/web/index.php/pim/viewEmployeeList',
  pimAddEmployee: '/web/index.php/pim/addEmployee',
  leave: '/web/index.php/leave/viewLeaveList',
  leaveApply: '/web/index.php/leave/assignLeave',
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
