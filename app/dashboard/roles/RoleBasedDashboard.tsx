import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { UserRole } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';
import DashboardBase from './DashboardBase';
import SuperAdminDashboard from './SuperAdminDashboard';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import OperatorDashboard from './OperatorDashboard';
import ViewerDashboard from './ViewerDashboard';
import AuditorDashboard from './AuditorDashboard';

interface DashboardProps {
  assets: any[]; // Consider defining a proper type for assets
}

export default async function RoleBasedDashboard({ assets }: { assets: any[] }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const { role } = session.user;

  const dashboardProps: DashboardProps = {
    assets,
  };

  const renderDashboard = () => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return <SuperAdminDashboard {...dashboardProps} />;
      case UserRole.ADMIN:
        return <AdminDashboard {...dashboardProps} />;
      case UserRole.MANAGER:
        return <ManagerDashboard {...dashboardProps} />;
      case UserRole.OPERATOR:
        return <OperatorDashboard {...dashboardProps} />;
      case UserRole.VIEWER:
        return <ViewerDashboard {...dashboardProps} />;
      case UserRole.AUDITOR:
        return <AuditorDashboard {...dashboardProps} />;
      default:
        return <ViewerDashboard {...dashboardProps} />;
    }
  };

  return (
    <DashboardBase role={role}>
      {renderDashboard()}
    </DashboardBase>
  );
}
