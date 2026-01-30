/**
 * ============================
 * System Permissions
 * ============================
 * - Atomic
 * - Feature-based
 * - Action-oriented
 */
export enum Permission {
  // User
  USER_READ = 'USER_READ',
  USER_WRITE = 'USER_WRITE',

  // Admin
  ADMIN_DASHBOARD_VIEW = 'ADMIN_DASHBOARD_VIEW',
  SETTINGS_MANAGE = 'SETTINGS_MANAGE',

  // Jobs
  JOB_READ = 'JOB_READ',
  JOB_WRITE = 'JOB_WRITE',
}
