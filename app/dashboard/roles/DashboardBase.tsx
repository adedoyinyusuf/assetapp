import { UserRole } from '@/lib/auth/roles';
import { ReactNode } from 'react';

interface DashboardBaseProps {
  role: UserRole;
  children: ReactNode;
}

export default function DashboardBase({ role, children }: DashboardBaseProps) {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {getDashboardTitle(role)} Dashboard
        </h1>
        <p className="text-gray-600">
          {getDashboardDescription(role)}
        </p>
      </div>
      <div className="grid gap-6">
        {children}
      </div>
    </div>
  );
}

function getDashboardTitle(role: UserRole): string {
  switch (role) {
    case 'SUPERADMIN':
      return 'System Administration';
    case 'ADMIN':
      return 'Administration';
    case 'MANAGER':
      return 'Management';
    case 'OPERATOR':
      return 'Operations';
    case 'VIEWER':
      return 'Asset Viewer';
    default:
      return 'Dashboard';
  }
}

function getDashboardDescription(role: UserRole): string {
  switch (role) {
    case 'SUPERADMIN':
      return 'Full system administration and configuration';
    case 'ADMIN':
      return 'User and system management';
    case 'MANAGER':
      return 'Team and asset management';
    case 'OPERATOR':
      return 'Asset operations and maintenance';
    case 'VIEWER':
      return 'Read-only access to asset information';
    default:
      return 'Your personalized dashboard';
  }
}
