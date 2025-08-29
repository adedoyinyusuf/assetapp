// User roles with increasing level of access
export enum UserRole {
  VIEWER = 'VIEWER',        // Can view assets and reports
  OPERATOR = 'OPERATOR',    // Can manage assets and operations
  MANAGER = 'MANAGER',      // Can manage assets, operations, and view reports
  ADMIN = 'ADMIN',          // Full access including user management
  SUPER_ADMIN = 'SUPER_ADMIN' // System owner with all permissions
}

// Available resources in the system
export enum Resource {
  ASSET = 'ASSET',
  ASSET_CATEGORY = 'ASSET_CATEGORY',
  ASSET_MOVEMENT = 'ASSET_MOVEMENT',
  USER = 'USER',
  ROLE = 'ROLE',
  PERMISSION = 'PERMISSION',
  REPORT = 'REPORT',
  DASHBOARD = 'DASHBOARD',
  SETTINGS = 'SETTINGS'
}

// Available actions for resources
export enum Action {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MANAGE = 'MANAGE',  // Special action that includes all CRUD operations
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT'
}

// Permission type combining resource and action
export type Permission = `${Action}_${Resource}`;

// Define base permissions for each role
const basePermissions: Record<UserRole, Permission[]> = {
  [UserRole.VIEWER]: [
    `${Action.READ}_${Resource.ASSET}`,
    `${Action.READ}_${Resource.REPORT}`,
    `${Action.READ}_${Resource.DASHBOARD}`
  ],
  [UserRole.OPERATOR]: [
    `${Action.CREATE}_${Resource.ASSET}`,
    `${Action.UPDATE}_${Resource.ASSET}`,
    `${Action.CREATE}_${Resource.ASSET_MOVEMENT}`,
    `${Action.UPDATE}_${Resource.ASSET_MOVEMENT}`
  ],
  [UserRole.MANAGER]: [
    `${Action.DELETE}_${Resource.ASSET}`,
    `${Action.DELETE}_${Resource.ASSET_MOVEMENT}`,
    `${Action.READ}_${Resource.USER}`,
    `${Action.UPDATE}_${Resource.USER}`,
    `${Action.EXPORT}_${Resource.REPORT}`
  ],
  [UserRole.ADMIN]: [
    `${Action.MANAGE}_${Resource.ASSET}`,
    `${Action.MANAGE}_${Resource.ASSET_CATEGORY}`,
    `${Action.MANAGE}_${Resource.ASSET_MOVEMENT}`,
    `${Action.MANAGE}_${Resource.USER}`,
    `${Action.MANAGE}_${Resource.REPORT}`,
    `${Action.IMPORT}_${Resource.ASSET}`
  ],
  [UserRole.SUPER_ADMIN]: [
    `${Action.MANAGE}_${Resource.ASSET}`,
    `${Action.MANAGE}_${Resource.ASSET_CATEGORY}`,
    `${Action.MANAGE}_${Resource.ASSET_MOVEMENT}`,
    `${Action.MANAGE}_${Resource.USER}`,
    `${Action.MANAGE}_${Resource.ROLE}`,
    `${Action.MANAGE}_${Resource.PERMISSION}`,
    `${Action.MANAGE}_${Resource.REPORT}`,
    `${Action.MANAGE}_${Resource.DASHBOARD}`,
    `${Action.MANAGE}_${Resource.SETTINGS}`
  ]
};

// Function to accumulate permissions based on role hierarchy
function getAccumulatedPermissions(role: UserRole): Permission[] {
  const roleHierarchy = Object.values(UserRole);
  const roleIndex = roleHierarchy.indexOf(role);
  const permissions = new Set<Permission>();

  // Include all permissions from roles up to and including the specified role
  for (let i = 0; i <= roleIndex; i++) {
    const currentRole = roleHierarchy[i] as UserRole;
    basePermissions[currentRole]?.forEach(permission => {
      permissions.add(permission);
    });
  }

  return Array.from(permissions);
}

// Default permissions for each role with inheritance
const defaultPermissions: Record<UserRole, Permission[]> = {
  [UserRole.VIEWER]: getAccumulatedPermissions(UserRole.VIEWER),
  [UserRole.OPERATOR]: getAccumulatedPermissions(UserRole.OPERATOR),
  [UserRole.MANAGER]: getAccumulatedPermissions(UserRole.MANAGER),
  [UserRole.ADMIN]: getAccumulatedPermissions(UserRole.ADMIN),
  [UserRole.SUPER_ADMIN]: getAccumulatedPermissions(UserRole.SUPER_ADMIN)
};

// Type for permission checking
export type ResourceType = keyof typeof Resource;
export type ActionType = keyof typeof Action;

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userRole: UserRole,
  resource: Resource,
  action: Action
): boolean {
  // Super admin always has all permissions
  if (userRole === UserRole.SUPER_ADMIN) return true;
  
  const permissions = defaultPermissions[userRole] || [];
  const requiredPermission = `${action}_${resource}` as Permission;
  
  // Check for exact permission or MANAGE permission for the resource
  return (
    permissions.includes(requiredPermission) ||
    permissions.includes(`${Action.MANAGE}_${resource}` as Permission)
  );
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return [...(defaultPermissions[role] || [])];
}

/**
 * Check if a user can perform an action on a resource
 */
export function can(
  userRole: UserRole,
  action: Action,
  resource: Resource
): boolean {
  return hasPermission(userRole, resource, action);
}

/**
 * Get the minimum role required for a specific permission
 */
export function getMinimumRoleForPermission(
  resource: Resource,
  action: Action
): UserRole | null {
  const requiredPermission = `${action}_${resource}` as Permission;
  
  for (const role of Object.values(UserRole)) {
    const permissions = defaultPermissions[role as UserRole];
    if (permissions && permissions.includes(requiredPermission)) {
      return role as UserRole;
    }
  }
  
  return null;
}

/**
 * Check if a user can access a route based on their role
 */
export function canAccessRoute(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const roleHierarchy = Object.values(UserRole);
  const userLevel = roleHierarchy.indexOf(userRole);
  const requiredLevel = roleHierarchy.indexOf(requiredRole);
  
  return userLevel >= requiredLevel;
}
