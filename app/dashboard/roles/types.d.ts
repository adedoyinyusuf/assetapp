declare module './SuperAdminDashboard' {
  import { FC } from 'react';
  const SuperAdminDashboard: FC<{ assets: any[] }>;
  export default SuperAdminDashboard;
}

declare module './AdminDashboard' {
  import { FC } from 'react';
  const AdminDashboard: FC<{ assets: any[] }>;
  export default AdminDashboard;
}

declare module './ManagerDashboard' {
  import { FC } from 'react';
  const ManagerDashboard: FC<{ assets: any[] }>;
  export default ManagerDashboard;
}

declare module './OperatorDashboard' {
  import { FC } from 'react';
  const OperatorDashboard: FC<{ assets: any[] }>;
  export default OperatorDashboard;
}

declare module './ViewerDashboard' {
  import { FC } from 'react';
  const ViewerDashboard: FC<{ assets: any[] }>;
  export default ViewerDashboard;
}
