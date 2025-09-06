export interface Permission {
  name: string;
  description?: string;
}

export type PermissionName = 
  | 'VIEW_ASSETS'
  | 'MANAGE_ASSETS'
  | 'VIEW_USERS'
  | 'MANAGE_USERS'
  | 'VIEW_ROLES'
  | 'MANAGE_ROLES'
  | 'VIEW_AUDIT_LOGS'
  | 'MANAGE_SETTINGS';

// If you have specific permissions, you can define them like this:
export const PERMISSIONS: Record<PermissionName, Permission> = {
  VIEW_ASSETS: { name: 'VIEW_ASSETS', description: 'View asset listings' },
  MANAGE_ASSETS: { name: 'MANAGE_ASSETS', description: 'Create, update, and delete assets' },
  VIEW_USERS: { name: 'VIEW_USERS', description: 'View user accounts' },
  MANAGE_USERS: { name: 'MANAGE_USERS', description: 'Create, update, and delete user accounts' },
  VIEW_ROLES: { name: 'VIEW_ROLES', description: 'View roles and permissions' },
  MANAGE_ROLES: { name: 'MANAGE_ROLES', description: 'Create, update, and delete roles' },
  VIEW_AUDIT_LOGS: { name: 'VIEW_AUDIT_LOGS', description: 'View system audit logs' },
  MANAGE_SETTINGS: { name: 'MANAGE_SETTINGS', description: 'Modify system settings' },
};
