'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';
import { Action, Resource, Task, can, canPerformTask, canAccessRoute } from '@/lib/auth/roles';
import { UserRole } from '@/lib/auth/roles';
import LoadingSpinner from './LoadingSpinner';

interface PermissionGateProps {
  children: ReactNode;
  requiredPermission?: [Action, Resource];
  requiredTask?: Task;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
  fallback?: ReactNode;
  showLoading?: boolean;
}

export function PermissionGate({
  children,
  requiredPermission,
  requiredTask,
  requiredRole,
  allowedRoles,
  fallback = <AccessDenied />,
  showLoading = true
}: PermissionGateProps) {
  const { data: session, status } = useSession();

  // Show loading while session is loading
  if (status === 'loading' && showLoading) {
    return <LoadingSpinner text="Checking permissions..." />;
  }

  // If no session, show access denied
  if (!session?.user?.role) {
    return fallback;
  }

  const userRole = session.user.role as UserRole;

  // Check allowed roles (strict list check)
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return fallback;
  }

  // Check role-based access first (hierarchy check)
  if (requiredRole && !canAccessRoute(userRole, requiredRole)) {
    return fallback;
  }

  // Check permission-based access
  if (requiredPermission && !can(userRole, requiredPermission[0], requiredPermission[1])) {
    return fallback;
  }

  // Check task-based access
  if (requiredTask && !canPerformTask(userRole, requiredTask)) {
    return fallback;
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Access denied component
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
      <p className="text-gray-600 mb-4">
        You don&apos;t have permission to access this feature. Please contact your administrator if you believe this is an error.
      </p>
      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
      >
        Go Back
      </button>
    </div>
  );
}

// Convenience components for common permission checks
export function AssetPermissionGate({ children, action = Action.READ, fallback }: {
  children: ReactNode;
  action?: Action;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate
      requiredPermission={[action, Resource.ASSET]}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}

export function ReportPermissionGate({ children, action = Action.READ, fallback }: {
  children: ReactNode;
  action?: Action;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate
      requiredPermission={[action, Resource.REPORT]}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}

export function AnalyticsPermissionGate({ children, task = Task.VIEW_BASIC_ANALYTICS, fallback }: {
  children: ReactNode;
  task?: Task;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate
      requiredTask={task}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}

export function SearchPermissionGate({ children, task = Task.BASIC_SEARCH, fallback }: {
  children: ReactNode;
  task?: Task;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate
      requiredTask={task}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}

export function UserManagementGate({ children, fallback }: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate
      requiredPermission={[Action.READ, Resource.USER]}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}

export function WebSocketPermissionGate({ children, fallback }: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate
      requiredTask={Task.ACCESS_WEBSOCKET}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}
