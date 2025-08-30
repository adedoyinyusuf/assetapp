import { getAssets } from '@/app/actions';
import RoleBasedDashboard from './roles/RoleBasedDashboard';

export default async function DashboardPage() {
  const assets = await getAssets();
  return <RoleBasedDashboard assets={assets} />;
}

