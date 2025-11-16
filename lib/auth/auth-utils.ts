import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { UserRole } from '@/lib/auth/roles'

/**
 * Get the current session for server-side operations
 * This is a wrapper around getServerSession for consistency
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission) || userPermissions.includes(UserRole.SUPER_ADMIN)
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => hasPermission(userPermissions, permission));
}