import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, Package, ClipboardList } from 'lucide-react';

export default function ManagerDashboard({ assets }: { assets: any[] }) {
  const stats = [
    {
      title: 'Total Assets',
      value: assets.length,
      icon: <Package className="h-6 w-6 text-blue-500" />,
      description: 'Under management',
    },
    {
      title: 'Team Members',
      value: '8',
      icon: <Users className="h-6 w-6 text-green-500" />,
      description: 'Active in your team',
    },
    {
      title: 'Pending Approvals',
      value: '5',
      icon: <ClipboardList className="h-6 w-6 text-yellow-500" />,
      description: 'Requests waiting',
    },
    {
      title: 'Assets Due',
      value: '3',
      icon: <FileText className="h-6 w-6 text-purple-500" />,
      description: 'Maintenance this week',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  View Team
                </Button>
                <Button variant="outline" className="justify-start">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Approve Requests
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <div>
                  <p className="text-sm font-medium">5 new assets added</p>
                  <p className="text-xs text-muted-foreground">This week</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                <div>
                  <p className="text-sm font-medium">2 maintenance due</p>
                  <p className="text-xs text-muted-foreground">In the next 7 days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
