// User roles with increasing level of access
export enum UserRole {
  VIEWER = 'VIEWER',        // Can view assets and reports
  OPERATOR = 'OPERATOR',    // Can manage assets and operations
  MANAGER = 'MANAGER',      // Can manage assets, operations, and view reports
  AUDITOR = 'AUDITOR',      // Can view and audit all assets and reports
  ADMIN = 'ADMIN',          // Full access including user management
  SUPER_ADMIN = 'SUPERADMIN' // System owner with all permissions (note: no underscore to match database)
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
  SETTINGS = 'SETTINGS',
  ANALYTICS = 'ANALYTICS',
  SEARCH = 'SEARCH',
  WEBSOCKET = 'WEBSOCKET'
}

// Available actions for resources
export enum Action {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  AUDIT = 'AUDIT',
  DELETE = 'DELETE',
  MANAGE = 'MANAGE',  // Special action that includes all CRUD operations
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  SEARCH = 'SEARCH',
  ANALYZE = 'ANALYZE'
}

// Task-based permissions for granular control
export enum Task {
  // Asset Tasks
  VIEW_ASSET_DETAILS = 'VIEW_ASSET_DETAILS',
  CREATE_ASSET = 'CREATE_ASSET',
  UPDATE_ASSET = 'UPDATE_ASSET',
  DELETE_ASSET = 'DELETE_ASSET',
  APPROVE_ASSET_CREATION = 'APPROVE_ASSET_CREATION',
  AUDIT_ASSET = 'AUDIT_ASSET',
  
  // Movement Tasks
  VIEW_MOVEMENT_HISTORY = 'VIEW_MOVEMENT_HISTORY',
  CREATE_MOVEMENT = 'CREATE_MOVEMENT',
  APPROVE_MOVEMENT = 'APPROVE_MOVEMENT',
  CANCEL_MOVEMENT = 'CANCEL_MOVEMENT',
  
  // Report Tasks
  VIEW_BASIC_REPORTS = 'VIEW_BASIC_REPORTS',
  VIEW_ADVANCED_REPORTS = 'VIEW_ADVANCED_REPORTS',
  EXPORT_REPORTS = 'EXPORT_REPORTS',
  SCHEDULE_REPORTS = 'SCHEDULE_REPORTS',
  
  // Analytics Tasks
  VIEW_BASIC_ANALYTICS = 'VIEW_BASIC_ANALYTICS',
  VIEW_ADVANCED_ANALYTICS = 'VIEW_ADVANCED_ANALYTICS',
  EXPORT_ANALYTICS = 'EXPORT_ANALYTICS',
  
  // Search Tasks
  BASIC_SEARCH = 'BASIC_SEARCH',
  ADVANCED_SEARCH = 'ADVANCED_SEARCH',
  SAVE_SEARCHES = 'SAVE_SEARCHES',
  
  // User Management Tasks
  VIEW_USERS = 'VIEW_USERS',
  CREATE_USERS = 'CREATE_USERS',
  UPDATE_USER_ROLES = 'UPDATE_USER_ROLES',
  DEACTIVATE_USERS = 'DEACTIVATE_USERS',
  
  // System Tasks
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  MANAGE_SYSTEM_SETTINGS = 'MANAGE_SYSTEM_SETTINGS',
  ACCESS_WEBSOCKET = 'ACCESS_WEBSOCKET'
}

// Permission type combining resource and action
export type Permission = `${Action}_${Resource}`;

// Task-based permission mapping for each role
const taskPermissions: Record<UserRole, Task[]> = {
  [UserRole.VIEWER]: [
    Task.VIEW_ASSET_DETAILS,
    Task.VIEW_MOVEMENT_HISTORY,
    Task.VIEW_BASIC_REPORTS,
    Task.BASIC_SEARCH,
    Task.VIEW_BASIC_ANALYTICS
  ],
  [UserRole.OPERATOR]: [
    Task.VIEW_ASSET_DETAILS,
    Task.CREATE_ASSET,
    Task.UPDATE_ASSET,
    Task.CREATE_MOVEMENT,
    Task.VIEW_MOVEMENT_HISTORY,
    Task.VIEW_BASIC_REPORTS,
    Task.BASIC_SEARCH,
    Task.VIEW_BASIC_ANALYTICS,
    Task.ACCESS_WEBSOCKET
  ],
  [UserRole.MANAGER]: [
    Task.VIEW_ASSET_DETAILS,
    Task.CREATE_ASSET,
    Task.UPDATE_ASSET,
    Task.DELETE_ASSET,
    Task.CREATE_MOVEMENT,
    Task.APPROVE_MOVEMENT,
    Task.VIEW_MOVEMENT_HISTORY,
    Task.VIEW_BASIC_REPORTS,
    Task.VIEW_ADVANCED_REPORTS,
    Task.EXPORT_REPORTS,
    Task.BASIC_SEARCH,
    Task.ADVANCED_SEARCH,
    Task.VIEW_BASIC_ANALYTICS,
    Task.VIEW_ADVANCED_ANALYTICS,
    Task.VIEW_USERS,
    Task.ACCESS_WEBSOCKET
  ],
  [UserRole.AUDITOR]: [
    Task.VIEW_ASSET_DETAILS,
    Task.VIEW_MOVEMENT_HISTORY,
    Task.VIEW_BASIC_REPORTS,
    Task.VIEW_ADVANCED_REPORTS,
    Task.EXPORT_REPORTS,
    Task.AUDIT_ASSET,
    Task.BASIC_SEARCH,
    Task.ADVANCED_SEARCH,
    Task.VIEW_BASIC_ANALYTICS,
    Task.VIEW_ADVANCED_ANALYTICS,
    Task.EXPORT_ANALYTICS,
    Task.VIEW_AUDIT_LOGS,
    Task.ACCESS_WEBSOCKET
  ],
  [UserRole.ADMIN]: [
    Task.VIEW_ASSET_DETAILS,
    Task.CREATE_ASSET,
    Task.UPDATE_ASSET,
    Task.DELETE_ASSET,
    Task.APPROVE_ASSET_CREATION,
    Task.CREATE_MOVEMENT,
    Task.APPROVE_MOVEMENT,
    Task.VIEW_MOVEMENT_HISTORY,
    Task.VIEW_BASIC_REPORTS,
    Task.VIEW_ADVANCED_REPORTS,
    Task.EXPORT_REPORTS,
    Task.SCHEDULE_REPORTS,
    Task.BASIC_SEARCH,
    Task.ADVANCED_SEARCH,
    Task.SAVE_SEARCHES,
    Task.VIEW_BASIC_ANALYTICS,
    Task.VIEW_ADVANCED_ANALYTICS,
    Task.EXPORT_ANALYTICS,
    Task.VIEW_USERS,
    Task.CREATE_USERS,
    Task.UPDATE_USER_ROLES,
    Task.DEACTIVATE_USERS,
    Task.VIEW_AUDIT_LOGS,
    Task.MANAGE_SYSTEM_SETTINGS,
    Task.ACCESS_WEBSOCKET
  ],
  [UserRole.SUPER_ADMIN]: [
    // All tasks
    ...Object.values(Task)
  ]
};

// Define base permissions for each role
const basePermissions: Record<UserRole, Permission[]> = {
  [UserRole.VIEWER]: [
    `${Action.READ}_${Resource.ASSET}`,
    `${Action.READ}_${Resource.REPORT}`,
    `${Action.READ}_${Resource.DASHBOARD}`,
    `${Action.SEARCH}_${Resource.SEARCH}`,
    `${Action.READ}_${Resource.ANALYTICS}`
  ],
  [UserRole.AUDITOR]: [
    `${Action.READ}_${Resource.ASSET}`,
    `${Action.READ}_${Resource.ASSET_MOVEMENT}`,
    `${Action.READ}_${Resource.REPORT}`,
    `${Action.READ}_${Resource.DASHBOARD}`,
    `${Action.EXPORT}_${Resource.REPORT}`,
    `${Action.AUDIT}_${Resource.ASSET}`,
    `${Action.AUDIT}_${Resource.ASSET_MOVEMENT}`,
    `${Action.SEARCH}_${Resource.SEARCH}`,
    `${Action.READ}_${Resource.ANALYTICS}`,
    `${Action.EXPORT}_${Resource.ANALYTICS}`,
    `${Action.READ}_${Resource.USER}` // For audit logs
  ],
  [UserRole.OPERATOR]: [
    `${Action.CREATE}_${Resource.ASSET}`,
    `${Action.UPDATE}_${Resource.ASSET}`,
    `${Action.CREATE}_${Resource.ASSET_MOVEMENT}`,
    `${Action.UPDATE}_${Resource.ASSET_MOVEMENT}`,
    `${Action.READ}_${Resource.ASSET}`,
    `${Action.READ}_${Resource.REPORT}`,
    `${Action.READ}_${Resource.DASHBOARD}`,
    `${Action.SEARCH}_${Resource.SEARCH}`,
    `${Action.READ}_${Resource.ANALYTICS}`,
    `${Action.READ}_${Resource.WEBSOCKET}`
  ],
  [UserRole.MANAGER]: [
    `${Action.DELETE}_${Resource.ASSET}`,
    `${Action.DELETE}_${Resource.ASSET_MOVEMENT}`,
    `${Action.READ}_${Resource.USER}`,
    `${Action.UPDATE}_${Resource.USER}`,
    `${Action.EXPORT}_${Resource.REPORT}`,
    `${Action.READ}_${Resource.ASSET}`,
    `${Action.READ}_${Resource.REPORT}`,
    `${Action.READ}_${Resource.DASHBOARD}`,
    `${Action.SEARCH}_${Resource.SEARCH}`,
    `${Action.READ}_${Resource.ANALYTICS}`,
    `${Action.READ}_${Resource.WEBSOCKET}`,
    `${Action.APPROVE}_${Resource.ASSET_MOVEMENT}`
  ],
  [UserRole.ADMIN]: [
    `${Action.MANAGE}_${Resource.ASSET}`,
    `${Action.MANAGE}_${Resource.ASSET_CATEGORY}`,
    `${Action.MANAGE}_${Resource.ASSET_MOVEMENT}`,
    `${Action.MANAGE}_${Resource.USER}`,
    `${Action.MANAGE}_${Resource.REPORT}`,
    `${Action.IMPORT}_${Resource.ASSET}`,
    `${Action.MANAGE}_${Resource.ANALYTICS}`,
    `${Action.MANAGE}_${Resource.SEARCH}`,
    `${Action.MANAGE}_${Resource.WEBSOCKET}`,
    `${Action.MANAGE}_${Resource.SETTINGS}`
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
    `${Action.MANAGE}_${Resource.SETTINGS}`,
    `${Action.MANAGE}_${Resource.ANALYTICS}`,
    `${Action.MANAGE}_${Resource.SEARCH}`,
    `${Action.MANAGE}_${Resource.WEBSOCKET}`
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
  [UserRole.AUDITOR]: getAccumulatedPermissions(UserRole.AUDITOR),
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
 * Check if a user can perform a specific task
 */
export function canPerformTask(userRole: UserRole, task: Task): boolean {
  // Super admin can perform all tasks
  if (userRole === UserRole.SUPER_ADMIN) return true;
  
  const allowedTasks = taskPermissions[userRole] || [];
  return allowedTasks.includes(task);
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return [...(defaultPermissions[role] || [])];
}

/**
 * Get all tasks for a role
 */
export function getTasksForRole(role: UserRole): Task[] {
  return [...(taskPermissions[role] || [])];
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
 * Get the minimum role required for a specific task
 */
export function getMinimumRoleForTask(task: Task): UserRole | null {
  for (const role of Object.values(UserRole)) {
    const tasks = taskPermissions[role as UserRole];
    if (tasks && tasks.includes(task)) {
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

/**
 * Get feature flags for a user role
 */
export function getFeatureFlags(userRole: UserRole): string[] {
  const baseFlags = ['basic_dashboard'];
  
  if (canPerformTask(userRole, Task.VIEW_BASIC_ANALYTICS)) {
    baseFlags.push('basic_analytics');
  }
  
  if (canPerformTask(userRole, Task.VIEW_ADVANCED_ANALYTICS)) {
    baseFlags.push('advanced_analytics');
  }
  
  if (canPerformTask(userRole, Task.BASIC_SEARCH)) {
    baseFlags.push('basic_search');
  }
  
  if (canPerformTask(userRole, Task.ADVANCED_SEARCH)) {
    baseFlags.push('advanced_search');
  }
  
  if (canPerformTask(userRole, Task.ACCESS_WEBSOCKET)) {
    baseFlags.push('real_time_updates');
  }
  
  if (canPerformTask(userRole, Task.MANAGE_SYSTEM_SETTINGS)) {
    baseFlags.push('system_settings');
  }
  
  return baseFlags;
}
